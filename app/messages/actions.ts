"use server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildManagerAssignedMessage } from "./lib/assignment-notification";
import { getCurrentManagerContext, getCurrentManagerId } from "./lib/manager-context";
import { invokeManagerReplyFunction } from "./lib/manager-reply-api";
import type { SendManagerReplyResult } from "./types";

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export async function assignClientAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const managerId = String(formData.get("managerId") ?? "") || null;

  if (!clientId) {
    throw new Error("Missing client for assignment.");
  }

  const { managerId: currentManagerId, accessToken } =
    await getCurrentManagerContext();
  const admin = createSupabaseAdminClient();

  // Сначала читаем старое назначение, чтобы понять, действительно ли менеджер изменился.
  const { data: previousAssignment, error: previousAssignmentError } =
    await admin
      .from("client_assignments")
      .select("current_manager_id")
      .eq("client_id", clientId)
      .maybeSingle();

  if (previousAssignmentError) {
    throw new Error(previousAssignmentError.message);
  }

  // Блок защищает клиента от повторных сервисных сообщений.
  // Уведомление отправляется только при реальной передаче диалога новому менеджеру:
  // повторное сохранение того же менеджера и снятие назначения не создают сообщение в Telegram.
  const assignedManagerId =
    managerId && previousAssignment?.current_manager_id !== managerId
      ? managerId
      : null;

  const { data: assignedManager, error: assignedManagerError } =
    assignedManagerId
      ? await admin
          .from("managers")
          .select("name, surname, position")
          .eq("id", assignedManagerId)
          .single()
      : { data: null, error: null };

  if (assignedManagerError) {
    throw new Error(assignedManagerError.message);
  }

  // Upsert создает назначение для нового клиента или обновляет существующее.
  const { error: assignmentError } = await admin
    .from("client_assignments")
    .upsert(
      {
        client_id: clientId,
        current_manager_id: managerId,
        assigned_by_manager_id: currentManagerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" },
    );

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  // После успешного назначения отправляем клиенту сервисное сообщение в тот же чат.
  if (assignedManager) {
    const notificationResult = await invokeManagerReplyFunction(
      accessToken,
      clientId,
      buildManagerAssignedMessage(assignedManager),
    );

    if (!notificationResult.ok) {
      throw new Error(notificationResult.error);
    }
  }

  revalidatePath("/messages");
  redirect(`/messages?client=${clientId}`);
}

export async function markClientMessagesAsRead(clientId: string) {
  if (!clientId) {
    return;
  }

  const currentManagerId = await getCurrentManagerId();
  const admin = createSupabaseAdminClient();

  // Помечаем только входящие непрочитанные сообщения клиента.
  const { error: readError } = await admin
    .from("messages")
    .update({
      read_at: new Date().toISOString(),
      read_by_manager_id: currentManagerId,
    } as never)
    .eq("client_id", clientId)
    .filter("direction", "eq", "incoming")
    .is("read_at", null);

  if (readError) {
    throw new Error(readError.message);
  }

  revalidatePath("/messages");
}

export async function sendManagerReplyAction(
  clientId: string,
  text: string,
): Promise<SendManagerReplyResult> {
  const replyText = text.trim();

  if (!clientId || !replyText) {
    return {
      ok: false,
      error: "Message text is required.",
    };
  }

  const { managerId: currentManagerId, accessToken } =
    await getCurrentManagerContext();
  const admin = createSupabaseAdminClient();

  // Перед отправкой проверяем, что текущий менеджер действительно владеет диалогом.
  const { data: assignment, error: assignmentError } = await admin
    .from("client_assignments")
    .select("current_manager_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (assignmentError) {
    return {
      ok: false,
      error: assignmentError.message,
    };
  }

  if (assignment?.current_manager_id !== currentManagerId) {
    return {
      ok: false,
      error: "Only the assigned manager can reply to this client.",
    };
  }

  // Реальная отправка сообщения вынесена в Edge Function, где живет интеграция с Telegram.
  const result = await invokeManagerReplyFunction(
    accessToken,
    clientId,
    replyText,
  );

  if (!result.ok) {
    return result;
  }

  revalidatePath("/messages");
  return {
    ok: true,
    data: result.data,
  };
}

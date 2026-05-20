"use server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Json, Tables, TablesUpdate } from "@/lib/supabase/database.types";
import { getCurrentManagerContext, getCurrentManagerId } from "./lib/manager-context";
import { invokeManagerReplyFunction } from "./lib/manager-reply-api";
import type { SendManagerReplyResult } from "./types";

const MANAGER_INTRO_REPLY_KEY = "manager_intro_reply";
const DEFAULT_MANAGER_INTRO_REPLY =
  "Здравствуйте, на связи {manager_name} :)";

type MetadataObject = { [key: string]: Json | undefined };

function getMetadataObject(metadata: Json): MetadataObject {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata
    : {};
}

function getMetadataText(metadata: Json, key: string) {
  const value = getMetadataObject(metadata)[key];

  return typeof value === "string" ? value : "";
}

function formatManagerIntroReply(
  template: string,
  manager: Pick<Tables<"managers">, "name" | "surname" | "position">,
) {
  return template
    .replaceAll("{manager_name}", manager.name)
    .replaceAll("{manager_surname}", manager.surname)
    .replaceAll("{manager_position}", manager.position)
    .trim();
}

async function getManagerIntroReply(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  manager: Pick<Tables<"managers">, "name" | "surname" | "position">,
) {
  const { data } = await admin
    .from("chatbot_instructions")
    .select("metadata")
    .eq("is_active", true)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const template =
    data?.metadata && getMetadataText(data.metadata, MANAGER_INTRO_REPLY_KEY)
      ? getMetadataText(data.metadata, MANAGER_INTRO_REPLY_KEY)
      : DEFAULT_MANAGER_INTRO_REPLY;

  return formatManagerIntroReply(template, manager);
}

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

  const { managerId: currentManagerId } = await getCurrentManagerContext();
  const admin = createSupabaseAdminClient();

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

  revalidatePath("/messages");
  redirect(`/messages?client=${clientId}`);
}

export async function updateClientDialogStateAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "");
  const dialogStatus = String(formData.get("dialogStatus") ?? "");
  const urgencyLevel = String(formData.get("urgencyLevel") ?? "");
  const requestedManagerId = String(formData.get("managerId") ?? "") || null;

  if (!clientId) {
    throw new Error("Missing client.");
  }

  const validDialogStatuses = new Set(["waiting", "in_progress", "finished"]);
  const validUrgencyLevels = new Set(["low", "middle", "high"]);

  if (
    !validDialogStatuses.has(dialogStatus) ||
    !validUrgencyLevels.has(urgencyLevel)
  ) {
    throw new Error("Invalid client state.");
  }

  const admin = createSupabaseAdminClient();
  const { managerId: currentManagerId } = await getCurrentManagerContext();
  const now = new Date().toISOString();
  const managerId = dialogStatus === "finished" ? null : requestedManagerId;
  const payload: TablesUpdate<"clients"> = {
    dialog_status: dialogStatus as TablesUpdate<"clients">["dialog_status"],
    urgency_level: urgencyLevel as TablesUpdate<"clients">["urgency_level"],
    dialog_finished_at: dialogStatus === "finished" ? now : null,
    has_unresolved_manager_attention: dialogStatus === "waiting",
  };

  if (dialogStatus === "in_progress") {
    payload.dialog_started_at = now;
  }

  const { error } = await admin
    .from("clients")
    .update(payload)
    .eq("id", clientId);

  if (error) {
    throw new Error(error.message);
  }

  const { error: assignmentError } = await admin
    .from("client_assignments")
    .upsert(
      {
        client_id: clientId,
        current_manager_id: managerId,
        assigned_by_manager_id: currentManagerId,
        updated_at: now,
      },
      { onConflict: "client_id" },
    );

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  revalidatePath("/messages");
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
    .select("current_manager_id, updated_at")
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
  const { data: previousManagerMessage, error: previousManagerMessageError } =
    await admin
      .from("messages")
      .select("id")
      .eq("client_id", clientId)
      .eq("sender_type", "manager")
      .eq("sent_by_manager_id", currentManagerId)
      .gte("created_at", assignment.updated_at)
      .limit(1)
      .maybeSingle();

  if (previousManagerMessageError) {
    return {
      ok: false,
      error: previousManagerMessageError.message,
    };
  }

  if (!previousManagerMessage) {
    const { data: manager, error: managerError } = await admin
      .from("managers")
      .select("name, surname, position")
      .eq("id", currentManagerId)
      .single();

    if (managerError) {
      return {
        ok: false,
        error: managerError.message,
      };
    }

    const greetingResult = await invokeManagerReplyFunction(
      accessToken,
      clientId,
      await getManagerIntroReply(admin, manager),
    );

    if (!greetingResult.ok) {
      return greetingResult;
    }
  }

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

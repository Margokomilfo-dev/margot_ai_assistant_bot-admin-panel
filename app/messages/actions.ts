"use server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SendManagerReplyResult =
  | {
      ok: true;
      data: unknown;
    }
  | {
      ok: false;
      error: string;
    };

// Получаем id текущего менеджера для действий, где не нужен JWT пользователя.
async function getCurrentManagerId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const { data: currentManager, error: managerError } = await admin
    .from("managers")
    .select("id")
    .eq("user_id", data.user.id)
    .single();

  if (managerError) {
    throw new Error(managerError.message);
  }

  return currentManager.id;
}

// Готовит контекст текущего менеджера: id нужен для проверок, JWT — для будущего вызова Edge Function.
async function getCurrentManagerContext() {
  const supabase = await createSupabaseServerClient();
  const [{ data: userData, error }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  if (error || !userData.user) {
    redirect("/login");
  }

  if (!sessionData.session?.access_token) {
    throw new Error("Missing authenticated Supabase session.");
  }

  const admin = createSupabaseAdminClient();
  const { data: currentManager, error: managerError } = await admin
    .from("managers")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (managerError) {
    throw new Error(managerError.message);
  }

  return {
    managerId: currentManager.id,
    accessToken: sessionData.session.access_token,
  };
}

// Единая точка отправки сообщений через backend Edge Function.
async function invokeManagerReplyFunction(
  accessToken: string,
  clientId: string,
  text: string,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      error: "Missing Supabase URL or publishable key.",
    } satisfies SendManagerReplyResult;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/manager-reply`, {
    method: "POST",
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      text,
    }),
  });

  const responseText = await response.text();
  let data: unknown = responseText;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      error: responseText
        ? `Edge Function returned ${response.status}: ${responseText}`
        : `Edge Function returned ${response.status}`,
    } satisfies SendManagerReplyResult;
  }

  return {
    ok: true,
    data,
  } satisfies SendManagerReplyResult;
}

function buildManagerAssignedMessage(manager: {
  name: string;
  surname: string;
  position: string;
}) {
  return [
    "Здравствуйте! 👋",
    "",
    "<b>Хорошая новость:</b> ваш вопрос уже передан специалисту ✅",
    "",
    `С вами будет работать <b>${manager.name} ${manager.surname}</b>.`,
    "",
    "Специалист внимательно изучит ваш вопрос и скоро свяжется с вами 💬",
    "",
    "<i>Спасибо за ваше терпение!</i> 💫",
  ].join("\n");
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

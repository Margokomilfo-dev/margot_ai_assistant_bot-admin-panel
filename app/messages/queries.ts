import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { Tables } from "@/lib/supabase/database.types";
import type {
  Client,
  ClientAssignment,
  ClientLastReply,
  ClientMessageStatus,
  Manager,
  Message,
} from "./types";

const managerSelect = "id, name, surname, position, user_id, created_at";
type MessageReadStateRow = Pick<
  Tables<"messages">,
  | "id"
  | "bot_reply_status"
  | "client_id"
  | "created_at"
  | "direction"
  | "read_at"
  | "related_client_message_id"
  | "requires_manager_attention"
  | "sent_by_manager_id"
  | "sender_type"
>;

function getBotReadAtByClientMessageId(messages: MessageReadStateRow[]) {
  return messages.reduce((readAtByMessageId, message) => {
    if (
      message.sender_type === "bot" &&
      message.read_at !== null &&
      message.related_client_message_id !== null
    ) {
      readAtByMessageId.set(message.related_client_message_id, message.read_at);
    }

    return readAtByMessageId;
  }, new Map<string, string>());
}

function isIncomingUnreadForManager(
  message: MessageReadStateRow,
  botReadAtByClientMessageId: Map<string, string>,
) {
  return (
    message.direction === "incoming" &&
    message.read_at === null &&
    (message.requires_manager_attention === true ||
      !botReadAtByClientMessageId.has(message.id))
  );
}

function getLastReplyByClientId(
  messages: MessageReadStateRow[],
  managerById: Map<string, Manager>,
) {
  return messages.reduce((lastReplyByClientId, message) => {
    if (message.direction !== "outgoing") {
      return lastReplyByClientId;
    }

    const previousReply = lastReplyByClientId.get(message.client_id);

    if (
      previousReply?.created_at &&
      (!message.created_at || previousReply.created_at >= message.created_at)
    ) {
      return lastReplyByClientId;
    }

    const lastReply = message.sent_by_manager_id
      ? ({
          type: "manager",
          created_at: message.created_at,
          manager: managerById.get(message.sent_by_manager_id) ?? null,
        } satisfies ClientLastReply)
      : ({
          type: "bot",
          bot_reply_status: message.bot_reply_status,
          created_at: message.created_at,
          requires_manager_attention: message.requires_manager_attention,
        } satisfies ClientLastReply);

    lastReplyByClientId.set(message.client_id, lastReply);

    return lastReplyByClientId;
  }, new Map<string, ClientLastReply>());
}

function getLastClientMessageByClientId(messages: MessageReadStateRow[]) {
  return messages.reduce((lastMessageByClientId, message) => {
    if (message.direction !== "incoming") {
      return lastMessageByClientId;
    }

    const previousMessage = lastMessageByClientId.get(message.client_id);

    if (
      previousMessage?.created_at &&
      (!message.created_at || previousMessage.created_at >= message.created_at)
    ) {
      return lastMessageByClientId;
    }

    lastMessageByClientId.set(message.client_id, message);

    return lastMessageByClientId;
  }, new Map<string, MessageReadStateRow>());
}

function getClientMessageStatus(
  message: MessageReadStateRow | null,
  needsManagerAttention: boolean,
  lastReply: ClientLastReply | null,
  botReadAtByClientMessageId: Map<string, string>,
): ClientMessageStatus {
  if (!message) {
    return "none";
  }

  if (needsManagerAttention) {
    return "high";
  }

  if (
    lastReply?.type === "bot" &&
    (!message.created_at ||
      !lastReply.created_at ||
      lastReply.created_at >= message.created_at) &&
    (botReadAtByClientMessageId.has(message.id) ||
      message.read_at !== null ||
      !message.requires_manager_attention)
  ) {
    return "bot_replied";
  }

  if (!message.read_at) {
    return "middle";
  }

  return "low";
}

// Собираем список клиентов для sidebar: сортировка, назначения и счетчики unread.
export async function getClients(managers: Manager[], currentManagerId: string) {
  const supabase = createSupabaseAdminClient();

  // Клиенты идут по последнему сообщению, чтобы свежие диалоги были сверху.
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  // Назначения нужны, чтобы показать менеджера клиента и ограничить видимость unread.
  const { data: assignments, error: assignmentsError } = await supabase
    .from("client_assignments")
    .select(
      "id, client_id, current_manager_id, assigned_by_manager_id, updated_at",
    );

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  // Берем сообщения со статусами чтения отдельно и группируем их по клиентам.
  // Ответы бота не закрывают manager attention: старый важный вопрос клиента
  // остается активным, пока менеджер не ответит сам.
  const { data: messageReadStates, error: messageReadStatesError } = await supabase
    .from("messages")
    .select(
      "id, bot_reply_status, client_id, created_at, direction, read_at, related_client_message_id, requires_manager_attention, sent_by_manager_id, sender_type",
    );

  if (messageReadStatesError) {
    throw new Error(messageReadStatesError.message);
  }

  const managerById = new Map(managers.map((manager) => [manager.id, manager]));
  const lastReplyByClientId = getLastReplyByClientId(
    messageReadStates,
    managerById,
  );
  const lastClientMessageByClientId =
    getLastClientMessageByClientId(messageReadStates);
  const botReadAtByClientMessageId =
    getBotReadAtByClientMessageId(messageReadStates);

  const unresolvedAttentionByClientId = messageReadStates.reduce(
    (attentionByClientId, message) => {
      if (
        message.direction === "incoming" &&
        message.requires_manager_attention === true &&
        message.read_at === null
      ) {
        attentionByClientId.set(message.client_id, true);
      }

      return attentionByClientId;
    },
    new Map<string, boolean>(),
  );

  // Считаем все непрочитанные входящие сообщения клиента. Ответы бота не должны
  // скрывать старый вопрос, который еще ожидает менеджера.
  const unreadCountByClientId = messageReadStates.reduce((counts, message) => {
    if (isIncomingUnreadForManager(message, botReadAtByClientMessageId)) {
      counts.set(message.client_id, (counts.get(message.client_id) ?? 0) + 1);
    }

    return counts;
  }, new Map<string, number>());

  // Обогащаем assignment объектами менеджеров, чтобы UI не делал дополнительные запросы.
  const assignmentByClientId = new Map(
    assignments.map((assignment) => [
      assignment.client_id,
      {
        ...assignment,
        current_manager: assignment.current_manager_id
          ? managerById.get(assignment.current_manager_id) ?? null
          : null,
        assigned_by_manager: assignment.assigned_by_manager_id
          ? managerById.get(assignment.assigned_by_manager_id) ?? null
          : null,
      } satisfies ClientAssignment,
    ]),
  );

  return clients
    .map((client): Client => {
      const assignment = assignmentByClientId.get(client.id) ?? null;
      const lastReply = lastReplyByClientId.get(client.id) ?? null;
      const needsManagerAttention =
        client.has_unresolved_manager_attention === true ||
        unresolvedAttentionByClientId.get(client.id) === true;
      // Unread показываем только свободным клиентам или клиентам текущего менеджера.
      const shouldDisplayUnread =
        !assignment?.current_manager_id ||
        assignment.current_manager_id === currentManagerId;

      return {
        ...client,
        unread_count: shouldDisplayUnread
          ? unreadCountByClientId.get(client.id) ?? 0
          : 0,
        needs_manager_attention: needsManagerAttention,
        last_client_message_status: getClientMessageStatus(
          lastClientMessageByClientId.get(client.id) ?? null,
          needsManagerAttention,
          lastReply,
          botReadAtByClientMessageId,
        ),
        assignment,
        last_reply: lastReply,
        status: "not_resolved",
      };
    })
    .sort((firstClient, secondClient) => {
      if (
        firstClient.needs_manager_attention !==
        secondClient.needs_manager_attention
      ) {
        return firstClient.needs_manager_attention ? -1 : 1;
      }

      return 0;
    });
}

// Список менеджеров нужен для формы назначения диалога.
export async function getManagers() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("managers")
    .select(managerSelect)
    .order("surname", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data satisfies Manager[];
}

// Загружаем историю одного клиента в порядке реального чата.
export async function getMessagesByClientId(
  clientId: string,
  managers: Manager[],
) {
  const supabase = createSupabaseAdminClient();
  const managerById = new Map(managers.map((manager) => [manager.id, manager]));

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, bot_reply_status, client_id, text, created_at, direction, read_at, read_by_manager_id, related_client_message_id, requires_manager_attention, sent_by_manager_id, sender_type, attention_level, clients!inner(telegram_chat_id, telegram_user_id, username, first_name, last_name)",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const botReadAtByClientMessageId = getBotReadAtByClientMessageId(data);

  // Приводим join из Supabase к плоскому типу Message для компонентов чата.
  return data.map((message): Message => {
    const client = message.clients;
    const effectiveReadAt =
      message.direction === "incoming" &&
      message.requires_manager_attention !== true &&
      botReadAtByClientMessageId.has(message.id)
        ? message.read_at ?? botReadAtByClientMessageId.get(message.id) ?? null
        : message.read_at;

    return {
      id: message.id,
      client_id: message.client_id,
      chat_id: client.telegram_chat_id,
      user_id: client.telegram_user_id,
      username: client.username,
      first_name: client.first_name,
      last_name: client.last_name,
      text: message.text,
      created_at: message.created_at,
      direction: message.direction,
      bot_reply_status: message.bot_reply_status,
      related_client_message_id: message.related_client_message_id,
      requires_manager_attention: message.requires_manager_attention,
      read_at: effectiveReadAt,
      read_by_manager_id: message.read_by_manager_id,
      sent_by_manager_id: message.sent_by_manager_id,
      sender_type: message.sender_type,
      attention_level: message.attention_level,
      sent_by_manager: message.sent_by_manager_id
        ? managerById.get(message.sent_by_manager_id) ?? null
        : null,
    };
  });
}

// Защищает страницы админки и возвращает профиль менеджера из Supabase.
export async function getAuthorizedManager() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  // Связываем auth user с бизнес-профилем менеджера.
  const { data: manager, error: managerError } = await admin
    .from("managers")
    .select(managerSelect)
    .eq("user_id", data.user.id)
    .single();

  if (managerError) {
    throw new Error(managerError.message);
  }

  return manager satisfies Manager;
}

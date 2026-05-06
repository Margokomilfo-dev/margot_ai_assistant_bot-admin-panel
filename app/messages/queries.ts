import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { Client, ClientAssignment, Manager, Message } from "./types";

const managerSelect = "id, name, surname, position, user_id, created_at";
type ClientRowWithLastMessageAt = Omit<Client, "assignment" | "status">;
type UnreadMessageRow = {
  client_id: string;
  direction: "incoming" | "outgoing";
};
type MessageRow = {
  id: string;
  client_id: string;
  text: string;
  created_at: string | null;
  direction: "incoming" | "outgoing";
  read_at: string | null;
  read_by_manager_id: string | null;
  clients: {
    telegram_chat_id: number;
    telegram_user_id: number;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

// Собираем список клиентов для sidebar: сортировка, назначения и счетчики unread.
export async function getClients(managers: Manager[], currentManagerId: string) {
  const supabase = createSupabaseAdminClient();

  // Клиенты идут по последнему сообщению, чтобы свежие диалоги были сверху.
  const { data: clients, error } = await supabase
    .from("clients")
    .select(
      "id, telegram_chat_id, telegram_user_id, username, first_name, last_name, created_at, last_message_at",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .returns<ClientRowWithLastMessageAt[]>();

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

  // Берем непрочитанные сообщения отдельно и группируем их по клиентам.
  const { data: unreadMessages, error: unreadMessagesError } = await supabase
    .from("messages")
    .select("client_id, direction")
    .is("read_at", null)
    .returns<UnreadMessageRow[]>();

  if (unreadMessagesError) {
    throw new Error(unreadMessagesError.message);
  }

  // Считаем только входящие сообщения: ответы менеджера не должны быть unread.
  const unreadCountByClientId = unreadMessages.reduce((counts, message) => {
    if (message.direction === "incoming") {
      counts.set(message.client_id, (counts.get(message.client_id) ?? 0) + 1);
    }

    return counts;
  }, new Map<string, number>());

  const managerById = new Map(managers.map((manager) => [manager.id, manager]));
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

  return clients.map((client): Client => {
    const assignment = assignmentByClientId.get(client.id) ?? null;
    // Unread показываем только свободным клиентам или клиентам текущего менеджера.
    const shouldDisplayUnread =
      !assignment?.current_manager_id ||
      assignment.current_manager_id === currentManagerId;

    return {
      ...client,
      unread_count: shouldDisplayUnread
        ? unreadCountByClientId.get(client.id) ?? 0
        : 0,
      assignment,
      status: "not_resolved",
    };
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
export async function getMessagesByClientId(clientId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, client_id, text, created_at, direction, read_at, read_by_manager_id, clients!inner(telegram_chat_id, telegram_user_id, username, first_name, last_name)",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  // Приводим join из Supabase к плоскому типу Message для компонентов чата.
  return data.map((message): Message => {
    const client = message.clients;

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
      read_at: message.read_at,
      read_by_manager_id: message.read_by_manager_id,
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

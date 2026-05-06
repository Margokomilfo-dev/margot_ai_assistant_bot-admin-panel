// Локальные типы страницы сообщений. Они дополняют Supabase types, пока схема БД меняется.
export type Client = {
  id: string;
  telegram_chat_id: number;
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  last_message_at: string | null;
  unread_count: number;
  assignment: ClientAssignment | null;
  status: "not_resolved";
};

export type Message = {
  id: string;
  client_id: string;
  chat_id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  text: string;
  created_at: string | null;
  direction: "incoming" | "outgoing";
  read_at: string | null;
  read_by_manager_id: string | null;
};

export type Manager = {
  id: string;
  name: string;
  surname: string;
  position: string;
  user_id: string;
  created_at: string | null;
};

export type ClientAssignment = {
  id: string;
  client_id: string;
  current_manager_id: string | null;
  assigned_by_manager_id: string | null;
  updated_at: string | null;
  current_manager: Manager | null;
  assigned_by_manager: Manager | null;
};

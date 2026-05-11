import type { Tables } from "@/lib/supabase/database.types";

export type Manager = Tables<"managers">;

export type Client = Tables<"clients"> & {
  unread_count: number;
  needs_manager_attention: boolean;
  last_client_message_status: ClientMessageStatus;
  assignment: ClientAssignment | null;
  last_reply: ClientLastReply | null;
}

export type Message = Omit<Tables<"messages">, "direction"> & {
  chat_id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  direction: Tables<"messages">["direction"];
  sent_by_manager: Manager | null;
}

export type ClientAssignment = Tables<"client_assignments"> & {
  current_manager: Manager | null;
  assigned_by_manager: Manager | null;
}

export type ClientLastReply =
  | {
      type: "bot";
      bot_reply_status: string | null;
      created_at: string | null;
      requires_manager_attention: boolean | null;
    }
  | {
      type: "manager";
      created_at: string | null;
      manager: Manager | null;
    };

export type ClientMessageStatus =
  | "none"
  | "high"
  | "middle"
  | "low"
  | "bot_replied";

export type SendManagerReplyResult =
  | {
      ok: true;
      data: unknown;
    }
  | {
      ok: false;
      error: string;
    };

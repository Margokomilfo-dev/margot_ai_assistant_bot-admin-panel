export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chatbot_instructions: {
        Row: {
          ai_consecutive_reply_limit: number
          ai_intro_reply: string
          auto_finish_after_hours: number
          created_at: string | null
          fallback_reply: string
          handoff_reply: string
          id: string
          is_active: boolean
          match_count: number
          match_threshold: number
          max_output_tokens: number
          metadata: Json
          model: string
          name: string
          system_prompt: string
          temperature: number
          updated_at: string | null
        }
        Insert: {
          ai_consecutive_reply_limit?: number
          ai_intro_reply?: string
          auto_finish_after_hours?: number
          created_at?: string | null
          fallback_reply: string
          handoff_reply?: string
          id?: string
          is_active?: boolean
          match_count?: number
          match_threshold?: number
          max_output_tokens?: number
          metadata?: Json
          model?: string
          name: string
          system_prompt: string
          temperature?: number
          updated_at?: string | null
        }
        Update: {
          ai_consecutive_reply_limit?: number
          ai_intro_reply?: string
          auto_finish_after_hours?: number
          created_at?: string | null
          fallback_reply?: string
          handoff_reply?: string
          id?: string
          is_active?: boolean
          match_count?: number
          match_threshold?: number
          max_output_tokens?: number
          metadata?: Json
          model?: string
          name?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      chatbot_menu_items: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          is_active: boolean
          label: string
          metadata: Json
          reply_text: string | null
          row_order: number
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          action_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          label: string
          metadata?: Json
          reply_text?: string | null
          row_order?: number
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          metadata?: Json
          reply_text?: string | null
          row_order?: number
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      client_assignments: {
        Row: {
          assigned_by_manager_id: string | null
          client_id: string
          current_manager_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          assigned_by_manager_id?: string | null
          client_id: string
          current_manager_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          assigned_by_manager_id?: string | null
          client_id?: string
          current_manager_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_assigned_by_manager_id_fkey"
            columns: ["assigned_by_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_current_manager_id_fkey"
            columns: ["current_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ai_consecutive_replies_count: number
          created_at: string | null
          dialog_finished_at: string | null
          dialog_started_at: string | null
          dialog_status: "waiting" | "in_progress" | "finished"
          first_name: string | null
          handed_off_at: string | null
          has_unresolved_manager_attention: boolean
          id: string
          last_ai_reply_at: string | null
          last_message_at: string | null
          last_name: string | null
          telegram_chat_id: number
          telegram_user_id: number
          urgency_level: "low" | "middle" | "high"
          username: string | null
        }
        Insert: {
          ai_consecutive_replies_count?: number
          created_at?: string | null
          dialog_finished_at?: string | null
          dialog_started_at?: string | null
          dialog_status?: "waiting" | "in_progress" | "finished"
          first_name?: string | null
          handed_off_at?: string | null
          has_unresolved_manager_attention?: boolean
          id?: string
          last_ai_reply_at?: string | null
          last_message_at?: string | null
          last_name?: string | null
          telegram_chat_id: number
          telegram_user_id: number
          urgency_level?: "low" | "middle" | "high"
          username?: string | null
        }
        Update: {
          ai_consecutive_replies_count?: number
          created_at?: string | null
          dialog_finished_at?: string | null
          dialog_started_at?: string | null
          dialog_status?: "waiting" | "in_progress" | "finished"
          first_name?: string | null
          handed_off_at?: string | null
          has_unresolved_manager_attention?: boolean
          id?: string
          last_ai_reply_at?: string | null
          last_message_at?: string | null
          last_name?: string | null
          telegram_chat_id?: number
          telegram_user_id?: number
          urgency_level?: "low" | "middle" | "high"
          username?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category_id: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          is_active: boolean
          last_edited_by_manager_id: string | null
          metadata: Json
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean
          last_edited_by_manager_id?: string | null
          metadata?: Json
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean
          last_edited_by_manager_id?: string | null
          metadata?: Json
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_last_edited_by_manager_id_fkey"
            columns: ["last_edited_by_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      managers: {
        Row: {
          created_at: string | null
          id: string
          name: string
          position: string
          surname: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          position: string
          surname: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          position?: string
          surname?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          ai_confidence_score: number | null
          attention_level: "low" | "middle" | "high" | null
          bot_reply_status: string | null
          client_id: string
          created_at: string | null
          direction: "incoming" | "outgoing"
          id: string
          read_at: string | null
          read_by_manager_id: string | null
          related_client_message_id: string | null
          requires_manager_attention: boolean | null
          sent_by_manager_id: string | null
          sender_type: "client" | "bot" | "manager"
          text: string
        }
        Insert: {
          ai_confidence_score?: number | null
          attention_level?: "low" | "middle" | "high" | null
          bot_reply_status?: string | null
          client_id: string
          created_at?: string | null
          direction?: "incoming" | "outgoing"
          id?: string
          read_at?: string | null
          read_by_manager_id?: string | null
          related_client_message_id?: string | null
          requires_manager_attention?: boolean | null
          sent_by_manager_id?: string | null
          sender_type?: "client" | "bot" | "manager"
          text: string
        }
        Update: {
          ai_confidence_score?: number | null
          attention_level?: "low" | "middle" | "high" | null
          bot_reply_status?: string | null
          client_id?: string
          created_at?: string | null
          direction?: "incoming" | "outgoing"
          id?: string
          read_at?: string | null
          read_by_manager_id?: string | null
          related_client_message_id?: string | null
          requires_manager_attention?: boolean | null
          sent_by_manager_id?: string | null
          sender_type?: "client" | "bot" | "manager"
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_read_by_manager_id_fkey"
            columns: ["read_by_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_client_message_id_fkey"
            columns: ["related_client_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sent_by_manager_id_fkey"
            columns: ["sent_by_manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

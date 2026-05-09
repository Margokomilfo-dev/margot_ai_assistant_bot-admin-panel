export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
          created_at: string | null
          first_name: string | null
          id: string
          last_message_at: string | null
          last_name: string | null
          telegram_chat_id: number
          telegram_user_id: number
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_message_at?: string | null
          last_name?: string | null
          telegram_chat_id: number
          telegram_user_id: number
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_message_at?: string | null
          last_name?: string | null
          telegram_chat_id?: number
          telegram_user_id?: number
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
        ]
      }
      knowledge_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
          client_id: string
          created_at: string | null
          direction: string
          id: string
          read_at: string | null
          read_by_manager_id: string | null
          sent_by_manager_id: string | null
          text: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          direction?: string
          id?: string
          read_at?: string | null
          read_by_manager_id?: string | null
          sent_by_manager_id?: string | null
          text: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          read_at?: string | null
          read_by_manager_id?: string | null
          sent_by_manager_id?: string | null
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

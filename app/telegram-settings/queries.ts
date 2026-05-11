import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getTelegramMenuItems() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chatbot_menu_items")
    .select(
      "id, label, reply_text, action_type, row_order, sort_order, metadata, is_active, created_at, updated_at",
    )
    .order("row_order", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

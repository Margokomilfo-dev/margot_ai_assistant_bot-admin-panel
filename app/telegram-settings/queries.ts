import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getTelegramMenuItems() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chatbot_menu_items")
    .select(
      "id, label, reply_text, action_type, sort_order, is_active, updated_at",
    )
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

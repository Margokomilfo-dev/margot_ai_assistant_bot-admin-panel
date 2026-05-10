import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getChatbotInstructions() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chatbot_instructions")
    .select(
      "id, name, system_prompt, fallback_reply, model, match_threshold, match_count, max_output_tokens, temperature, metadata, is_active, created_at, updated_at",
    )
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

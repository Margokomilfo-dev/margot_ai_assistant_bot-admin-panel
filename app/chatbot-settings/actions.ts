"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { TablesInsert } from "@/lib/supabase/database.types";
import type { ChatbotActionResult } from "./types";

export async function saveChatbotInstructionAction(
  input: TablesInsert<"chatbot_instructions">,
): Promise<ChatbotActionResult> {
  const name = input.name.trim();
  const systemPrompt = input.system_prompt.trim();
  const fallbackReply = input.fallback_reply.trim();
  const handoffReply = input.handoff_reply?.trim() ?? "";
  const aiIntroReply = input.ai_intro_reply?.trim() ?? "";

  if (!name || !systemPrompt || !fallbackReply || !handoffReply) {
    return {
      ok: false,
      error: "Заполните название, system prompt, fallback reply и handoff reply.",
    };
  }

  const payload = {
    ai_consecutive_reply_limit: input.ai_consecutive_reply_limit ?? 3,
    ai_intro_reply: aiIntroReply,
    auto_finish_after_hours: input.auto_finish_after_hours ?? 24,
    fallback_reply: fallbackReply,
    handoff_reply: handoffReply,
    is_active: input.is_active ?? true,
    match_count: input.match_count ?? 3,
    match_threshold: input.match_threshold ?? 0.35,
    max_output_tokens: input.max_output_tokens ?? 500,
    metadata: input.metadata ?? {},
    model: input.model?.trim() || "gpt-4.1-mini",
    name,
    system_prompt: systemPrompt,
    temperature: input.temperature ?? 0.4,
    updated_at: new Date().toISOString(),
  };
  const supabase = createSupabaseAdminClient();
  const result = input.id
    ? await supabase.from("chatbot_instructions").update(payload).eq("id", input.id)
    : await supabase
        .from("chatbot_instructions")
        .insert(payload)
        .select("id")
        .single();

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  revalidatePath("/chatbot-settings");
  return { ok: true };
}

export async function deleteChatbotInstructionAction(input: {
  id: string;
}): Promise<ChatbotActionResult> {
  if (!input.id) {
    return { ok: false, error: "Выберите инструкцию." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chatbot_instructions")
    .delete()
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/chatbot-settings");
  return { ok: true };
}

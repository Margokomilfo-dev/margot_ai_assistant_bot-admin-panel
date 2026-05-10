"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { TablesInsert } from "@/lib/supabase/database.types";
import type { TelegramActionResult } from "./types";

export async function saveTelegramMenuItemAction(
  input: TablesInsert<"chatbot_menu_items">,
): Promise<TelegramActionResult> {
  const label = input.label.trim();

  if (!label) {
    return {
      ok: false,
      error: "Заполните название.",
    };
  }
  const payload = {
    action_type: input.action_type?.trim() || "reply",
    is_active: input.is_active ?? true,
    label,
    reply_text: input.reply_text?.trim(),
    sort_order: input.sort_order,
    updated_at: new Date().toISOString(),
  };
  const supabase = createSupabaseAdminClient();
  const result = input.id
    ? await supabase.from("chatbot_menu_items").update(payload).eq("id", input.id)
    : await supabase.from("chatbot_menu_items").insert(payload).select("id").single();

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  revalidatePath("/telegram-settings");
  return { ok: true };
}

export async function deleteTelegramMenuItemAction(input: {
  id: string;
}): Promise<TelegramActionResult> {
  if (!input.id) {
    return { ok: false, error: "Выберите пункт меню." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chatbot_menu_items")
    .delete()
    .eq("id", input.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/telegram-settings");
  return { ok: true };
}

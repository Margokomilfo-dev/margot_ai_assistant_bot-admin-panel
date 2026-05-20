import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Загружаем категории из Supabase на сервере.
// Они нужны для выпадающего списка при создании карточки знания.
export async function getKnowledgeCategories() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("knowledge_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Загружаем активные карточки базы знаний вместе с названием категории.
// Эти данные показываются в левом списке и подставляются в форму просмотра/редактирования.
export async function getKnowledgeArticles() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("knowledge_base")
    .select(
      "id, title, content, category_id, updated_at, last_edited_by_manager_id, knowledge_categories(name), last_edited_by_manager:managers!knowledge_base_last_edited_by_manager_id_fkey(id, name, surname, position)",
    )
    // Показываем менеджеру только включенные материалы, которые можно использовать для AI.
    .eq("is_active", true)
    // Сначала выводим самые недавно обновленные или созданные карточки.
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

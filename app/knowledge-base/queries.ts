import { createSupabaseAdminClient } from "@/lib/supabase/server";

import type { KnowledgeArticle, KnowledgeCategory } from "./types";

type KnowledgeArticleRow = {
  id: string;
  title: string;
  content: string;
  category_id: string;
  knowledge_categories: {
    name: string;
  } | null;
};

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

  return data satisfies KnowledgeCategory[];
}

// Загружаем активные карточки базы знаний вместе с названием категории.
// Эти данные показываются в левом списке и подставляются в форму просмотра/редактирования.
export async function getKnowledgeArticles() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("knowledge_base")
    .select("id, title, content, category_id, knowledge_categories(name)")
    // Показываем менеджеру только включенные материалы, которые можно использовать для AI.
    .eq("is_active", true)
    // Сначала выводим самые недавно обновленные или созданные карточки.
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .returns<KnowledgeArticleRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(
    (article): KnowledgeArticle => ({
      id: article.id,
      question: article.title,
      answer: article.content,
      categoryId: article.category_id,
      tag: article.knowledge_categories?.name ?? "Без категории",
    }),
  );
}

"use server";

import { revalidatePath } from "next/cache";

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { invokeKnowledgeFunction } from "./lib/knowledge-api";
import { getKnowledgeBaseContext } from "./lib/knowledge-context";
import type { KnowledgeActionResult } from "./types";

// Server Action вызывается из клиентской формы карточки.
// Здесь держим быструю проверку обязательных полей, чтобы не отправлять заведомо пустой запрос.
export async function createKnowledgeArticleAction(input: {
  title: TablesInsert<"knowledge_base">["title"];
  content: TablesInsert<"knowledge_base">["content"];
  category_id: TablesInsert<"knowledge_base">["category_id"];
}) {
  const title = input.title.trim();
  const content = input.content.trim();
  const categoryId = input.category_id.trim();

  if (!title) {
    return {
      ok: false,
      error: "Введите вопрос клиента.",
    } satisfies KnowledgeActionResult;
  }

  if (!content) {
    return {
      ok: false,
      error: "Введите ответ.",
    } satisfies KnowledgeActionResult;
  }

  if (!categoryId) {
    return {
      ok: false,
      error: "Выберите категорию.",
    } satisfies KnowledgeActionResult;
  }

  const { accessToken, managerId } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-base",
    method: "POST",
    payload: {
      category_id: categoryId,
      content,
      last_edited_by_manager_id: managerId,
      metadata: {
        created_by_manager_id: managerId,
        source: "admin-panel",
      },
      title,
    },
  });

  if (result.ok) {
    // После успешной записи просим Next.js заново получить данные страницы,
    // чтобы список карточек и категории обновились без ручной перезагрузки.
    revalidatePath("/knowledge-base");
  }

  return result;
}

// Server Action обновляет существующую карточку.
// PATCH /knowledge-base пересоздаст embedding на backend, если изменились title/content.
export async function updateKnowledgeArticleAction(input: {
  id: Tables<"knowledge_base">["id"];
  title: NonNullable<TablesUpdate<"knowledge_base">["title"]>;
  content: NonNullable<TablesUpdate<"knowledge_base">["content"]>;
  category_id: NonNullable<TablesUpdate<"knowledge_base">["category_id"]>;
}) {
  const id = input.id.trim();
  const title = input.title.trim();
  const content = input.content.trim();
  const categoryId = input.category_id.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите карточку для редактирования.",
    } satisfies KnowledgeActionResult;
  }

  if (!title) {
    return {
      ok: false,
      error: "Введите вопрос клиента.",
    } satisfies KnowledgeActionResult;
  }

  if (!content) {
    return {
      ok: false,
      error: "Введите ответ.",
    } satisfies KnowledgeActionResult;
  }

  if (!categoryId) {
    return {
      ok: false,
      error: "Выберите категорию.",
    } satisfies KnowledgeActionResult;
  }

  const { accessToken, managerId } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-base",
    method: "PATCH",
    payload: {
      category_id: categoryId,
      content,
      id,
      last_edited_by_manager_id: managerId,
      title,
    },
  });

  if (result.ok) {
    const admin = createSupabaseAdminClient();
    const { error: editorError } = await admin
      .from("knowledge_base")
      .update({ last_edited_by_manager_id: managerId })
      .eq("id", id);

    if (editorError) {
      return {
        ok: false,
        error: editorError.message,
      } satisfies KnowledgeActionResult;
    }

    revalidatePath("/knowledge-base");
  }

  return result satisfies KnowledgeActionResult;
}

// Server Action делает мягкое удаление карточки через backend:
// запись остается в базе, но получает is_active = false.
export async function deleteKnowledgeArticleAction(input: {
  id: Tables<"knowledge_base">["id"];
}) {
  const id = input.id.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите карточку для удаления.",
    } satisfies KnowledgeActionResult;
  }

  const { accessToken } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-base",
    method: "DELETE",
    payload: { id },
  });

  if (result.ok) {
    revalidatePath("/knowledge-base");
  }

  return result satisfies KnowledgeActionResult;
}

// Server Action вызывается из формы добавления категории.
// Здесь только валидируем ввод и передаем name в Edge Function knowledge-categories.
export async function createKnowledgeCategoryAction(input: {
  name: TablesInsert<"knowledge_categories">["name"];
}) {
  const name = input.name.trim();

  if (!name) {
    return {
      ok: false,
      error: "Введите название категории.",
    } satisfies KnowledgeActionResult;
  }

  const { accessToken } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-categories",
    method: "POST",
    payload: { name },
  });

  if (result.ok) {
    // Обновляем серверные данные страницы, чтобы новая категория появилась в select.
    revalidatePath("/knowledge-base");
  }

  return result;
}

// Server Action переименовывает категорию.
// PATCH /knowledge-categories пересоздает slug на backend, поэтому frontend отправляет только id и name.
export async function updateKnowledgeCategoryAction(input: {
  id: Tables<"knowledge_categories">["id"];
  name: NonNullable<TablesUpdate<"knowledge_categories">["name"]>;
}) {
  const id = input.id.trim();
  const name = input.name.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите категорию для редактирования.",
    } satisfies KnowledgeActionResult;
  }

  if (!name) {
    return {
      ok: false,
      error: "Введите название категории.",
    } satisfies KnowledgeActionResult;
  }

  const { accessToken } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-categories",
    method: "PATCH",
    payload: { id, name },
  });

  if (result.ok) {
    revalidatePath("/knowledge-base");
  }

  return result satisfies KnowledgeActionResult;
}

// Server Action мягко удаляет категорию через backend.
// Backend оставляет строку в базе с is_active = false, чтобы не ломать старые связи knowledge_base.
export async function deleteKnowledgeCategoryAction(input: {
  id: Tables<"knowledge_categories">["id"];
}) {
  const id = input.id.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите категорию для удаления.",
    } satisfies KnowledgeActionResult;
  }

  const { accessToken } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-categories",
    method: "DELETE",
    payload: { id },
  });

  if (result.ok) {
    revalidatePath("/knowledge-base");
  }

  return result satisfies KnowledgeActionResult;
}

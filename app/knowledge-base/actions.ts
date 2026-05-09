"use server";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  CreateKnowledgeArticleResult,
  CreateKnowledgeCategoryResult,
  DeleteKnowledgeArticleResult,
  DeleteKnowledgeCategoryResult,
  KnowledgeActionResult,
  UpdateKnowledgeArticleResult,
  UpdateKnowledgeCategoryResult,
} from "./types";

// Общий серверный контекст для всех действий базы знаний:
// проверяем текущего Supabase-пользователя, берем его access token для Edge Function
// и находим manager.id, чтобы backend понимал, кто создал запись.
async function getKnowledgeBaseContext() {
  const supabase = await createSupabaseServerClient();
  const [{ data: userData, error }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  if (error || !userData.user) {
    redirect("/login");
  }

  if (!sessionData.session?.access_token) {
    throw new Error("Missing authenticated Supabase session.");
  }

  const admin = createSupabaseAdminClient();
  const { data: manager, error: managerError } = await admin
    .from("managers")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (managerError) {
    throw new Error(managerError.message);
  }

  return {
    accessToken: sessionData.session.access_token,
    managerId: manager.id,
  };
}

function getSupabaseFunctionConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      error: "Missing Supabase URL or publishable key.",
    } as const;
  }

  return {
    ok: true,
    supabasePublishableKey,
    supabaseUrl,
  } as const;
}

// Единый helper для вызова Supabase Edge Functions.
// Все CRUD endpoints защищены JWT, поэтому каждый запрос передает access token менеджера.
async function invokeKnowledgeFunction(input: {
  accessToken: string;
  endpoint: "knowledge-base" | "knowledge-categories";
  method: "POST" | "PATCH" | "DELETE";
  payload: Record<string, unknown>;
}) {
  const config = getSupabaseFunctionConfig();

  if (!config.ok) {
    return {
      ok: false,
      error: config.error,
    } satisfies KnowledgeActionResult;
  }

  const response = await fetch(
    `${config.supabaseUrl}/functions/v1/${input.endpoint}`,
    {
      method: input.method,
      headers: {
        // apikey нужен Supabase Functions для идентификации проекта,
        // Authorization передает сессию текущего менеджера в backend.
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input.payload),
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      error: responseText
        ? `Edge Function returned ${response.status}: ${responseText}`
        : `Edge Function returned ${response.status}`,
    } satisfies KnowledgeActionResult;
  }

  return {
    ok: true,
  } satisfies KnowledgeActionResult;
}

// Server Action вызывается из клиентской формы карточки.
// Здесь держим быструю проверку обязательных полей, чтобы не отправлять заведомо пустой запрос.
export async function createKnowledgeArticleAction(input: {
  question: string;
  answer: string;
  categoryId: string;
}) {
  const question = input.question.trim();
  const answer = input.answer.trim();
  const categoryId = input.categoryId.trim();

  if (!question) {
    return {
      ok: false,
      error: "Введите вопрос клиента.",
    } satisfies CreateKnowledgeArticleResult;
  }

  if (!answer) {
    return {
      ok: false,
      error: "Введите ответ.",
    } satisfies CreateKnowledgeArticleResult;
  }

  if (!categoryId) {
    return {
      ok: false,
      error: "Выберите категорию.",
    } satisfies CreateKnowledgeArticleResult;
  }

  const { accessToken, managerId } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-base",
    method: "POST",
    payload: {
      category_id: categoryId,
      content: answer,
      metadata: {
        created_by_manager_id: managerId,
        source: "admin-panel",
      },
      title: question,
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
  id: string;
  question: string;
  answer: string;
  categoryId: string;
}) {
  const id = input.id.trim();
  const question = input.question.trim();
  const answer = input.answer.trim();
  const categoryId = input.categoryId.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите карточку для редактирования.",
    } satisfies UpdateKnowledgeArticleResult;
  }

  if (!question) {
    return {
      ok: false,
      error: "Введите вопрос клиента.",
    } satisfies UpdateKnowledgeArticleResult;
  }

  if (!answer) {
    return {
      ok: false,
      error: "Введите ответ.",
    } satisfies UpdateKnowledgeArticleResult;
  }

  if (!categoryId) {
    return {
      ok: false,
      error: "Выберите категорию.",
    } satisfies UpdateKnowledgeArticleResult;
  }

  const { accessToken } = await getKnowledgeBaseContext();
  const result = await invokeKnowledgeFunction({
    accessToken,
    endpoint: "knowledge-base",
    method: "PATCH",
    payload: {
      category_id: categoryId,
      content: answer,
      id,
      title: question,
    },
  });

  if (result.ok) {
    revalidatePath("/knowledge-base");
  }

  return result satisfies UpdateKnowledgeArticleResult;
}

// Server Action делает мягкое удаление карточки через backend:
// запись остается в базе, но получает is_active = false.
export async function deleteKnowledgeArticleAction(input: { id: string }) {
  const id = input.id.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите карточку для удаления.",
    } satisfies DeleteKnowledgeArticleResult;
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

  return result satisfies DeleteKnowledgeArticleResult;
}

// Server Action вызывается из формы добавления категории.
// Здесь только валидируем ввод и передаем name в Edge Function knowledge-categories.
export async function createKnowledgeCategoryAction(input: { name: string }) {
  const name = input.name.trim();

  if (!name) {
    return {
      ok: false,
      error: "Введите название категории.",
    } satisfies CreateKnowledgeCategoryResult;
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
  id: string;
  name: string;
}) {
  const id = input.id.trim();
  const name = input.name.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите категорию для редактирования.",
    } satisfies UpdateKnowledgeCategoryResult;
  }

  if (!name) {
    return {
      ok: false,
      error: "Введите название категории.",
    } satisfies UpdateKnowledgeCategoryResult;
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

  return result satisfies UpdateKnowledgeCategoryResult;
}

// Server Action мягко удаляет категорию через backend.
// Backend оставляет строку в базе с is_active = false, чтобы не ломать старые связи knowledge_base.
export async function deleteKnowledgeCategoryAction(input: { id: string }) {
  const id = input.id.trim();

  if (!id) {
    return {
      ok: false,
      error: "Выберите категорию для удаления.",
    } satisfies DeleteKnowledgeCategoryResult;
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

  return result satisfies DeleteKnowledgeCategoryResult;
}

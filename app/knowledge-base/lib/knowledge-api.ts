import type { KnowledgeActionResult } from "../types";

type KnowledgeEndpoint = "knowledge-base" | "knowledge-categories";
type KnowledgeMethod = "POST" | "PATCH" | "DELETE";

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
export async function invokeKnowledgeFunction(input: {
  accessToken: string;
  endpoint: KnowledgeEndpoint;
  method: KnowledgeMethod;
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

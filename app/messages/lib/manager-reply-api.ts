import type { SendManagerReplyResult } from "../types";

// Единая точка отправки сообщений через backend Edge Function.
export async function invokeManagerReplyFunction(
  accessToken: string,
  clientId: string,
  text: string,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      error: "Missing Supabase URL or publishable key.",
    } satisfies SendManagerReplyResult;
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/manager-reply`, {
    method: "POST",
    headers: {
      // Edge Function проверяет JWT менеджера и отправляет сообщение в Telegram.
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      text,
    }),
  });

  const responseText = await response.text();
  let data: unknown = responseText;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      error: responseText
        ? `Edge Function returned ${response.status}: ${responseText}`
        : `Edge Function returned ${response.status}`,
    } satisfies SendManagerReplyResult;
  }

  return {
    ok: true,
    data,
  } satisfies SendManagerReplyResult;
}

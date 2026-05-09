"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const MIN_PASSWORD_LENGTH = 6;

export type ResetPasswordState = {
  error: string | null;
};

// Server Action задает новый пароль после перехода из письма восстановления.
// Supabase может прислать либо code в query string, либо access/refresh token в hash.
export async function updatePasswordAction(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const repeatPassword = String(formData.get("repeatPassword") ?? "");
  const code = String(formData.get("code") ?? "");
  const accessToken = String(formData.get("accessToken") ?? "");
  const refreshToken = String(formData.get("refreshToken") ?? "");

  if (!password || !repeatPassword) {
    return {
      error: "Заполните оба поля.",
    };
  }

  if (password !== repeatPassword) {
    return {
      error: "Пароли не совпадают.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов.`,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    // Новый PKCE-flow: меняем одноразовый code на полноценную auth-сессию.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        error: error.message,
      };
    }
  } else if (accessToken && refreshToken) {
    // Fallback для ссылок, где Supabase вернул токены в URL hash.
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return {
        error: error.message,
      };
    }
  }

  // Пароль можно менять только после восстановления сессии выше.
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect("/messages");
}

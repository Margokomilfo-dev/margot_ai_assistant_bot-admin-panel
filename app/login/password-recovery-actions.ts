"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type PasswordRecoveryState = {
  error: string | null;
  message: string | null;
};

// Server Action отправляет письмо восстановления через Supabase Auth.
// redirectTo указывает на страницу, где пользователь задаст новый пароль.
export async function sendPasswordRecoveryEmail(
  _state: PasswordRecoveryState,
  formData: FormData,
): Promise<PasswordRecoveryState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return {
      error: "Введите email.",
      message: null,
    };
  }

  const headersList = await headers();
  const origin = headersList.get("origin");

  if (!origin) {
    return {
      error: "Не удалось определить адрес приложения.",
      message: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  // Admin client используется только на сервере: браузер не получает секретный ключ.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return {
      error: error.message,
      message: null,
    };
  }

  return {
    error: null,
    message: "Письмо для восстановления пароля отправлено.",
  };
}

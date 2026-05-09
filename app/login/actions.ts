"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import type { LoginFormState } from "./types";

// Server Action для формы входа: проверяет поля, создает Supabase-сессию
// и переводит авторизованного менеджера в раздел сообщений.
export async function loginAction(
  _state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Введите логин и пароль.",
    };
  }

  const supabase = await createSupabaseServerClient();

  // Supabase сам записывает auth cookies через server client, поэтому после redirect
  // остальные серверные страницы уже смогут получить текущего пользователя.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    return {
      error: "Неверный логин или пароль.",
    };
  }

  redirect("/messages");
}

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Server client работает с auth cookies текущего запроса.
// Его используем там, где важно знать текущего авторизованного пользователя.
export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SB_SECRET;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SB_SECRET");
  }

  const cookieStore = await cookies();

  const api = createServerClient<Database>(supabaseUrl, supabaseSecretKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components могут читать cookies, но запись должна случиться
          // до streaming. Обновление сессии при необходимости делает middleware/backend.
        }
      },
    },
  });
  return api;
}

// Admin client используется только на сервере для служебных запросов к таблицам.
// В браузер SB_SECRET попадать не должен.
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SB_SECRET;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SB_SECRET");
  }

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

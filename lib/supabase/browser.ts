import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null | undefined;

// Singleton для браузера: один Supabase client на вкладку, без дублей GoTrueClient.
export function createSupabaseBrowserClient() {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Без публичного ключа Realtime в браузере отключается, а серверная часть продолжает работать.
  if (!supabaseUrl || !supabasePublishableKey) {
    browserClient = null;
    return null;
  }

  browserClient = createBrowserClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
  );

  return browserClient;
}

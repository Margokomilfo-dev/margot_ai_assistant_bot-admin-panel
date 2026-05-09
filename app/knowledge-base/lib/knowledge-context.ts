import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Общий серверный контекст для всех действий базы знаний:
// проверяем текущего Supabase-пользователя, берем access token для Edge Function
// и находим manager.id, чтобы backend понимал, кто создал запись.
export async function getKnowledgeBaseContext() {
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

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Получаем id текущего менеджера для действий, где не нужен JWT пользователя.
export async function getCurrentManagerId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const admin = createSupabaseAdminClient();
  const { data: currentManager, error: managerError } = await admin
    .from("managers")
    .select("id")
    .eq("user_id", data.user.id)
    .single();

  if (managerError) {
    throw new Error(managerError.message);
  }

  return currentManager.id;
}

// Готовит контекст текущего менеджера: id нужен для проверок, JWT — для вызова Edge Function.
export async function getCurrentManagerContext() {
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
  const { data: currentManager, error: managerError } = await admin
    .from("managers")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (managerError) {
    throw new Error(managerError.message);
  }

  return {
    accessToken: sessionData.session.access_token,
    managerId: currentManager.id,
  };
}

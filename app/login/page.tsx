import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { LoginForm } from "./components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/messages");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Вход</h1>

        <LoginForm />

        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          <p className="mb-1 font-medium text-slate-700">Тестовый аккаунт</p>
          <p>
            <span>Email: </span>
            <span className="font-mono text-slate-700">test@test.com</span>
            <span className="mx-2 text-slate-300">/</span>
            <span>Password: </span>
            <span className="font-mono text-slate-700">test</span>
          </p>
        </div>
      </section>
    </main>
  );
}

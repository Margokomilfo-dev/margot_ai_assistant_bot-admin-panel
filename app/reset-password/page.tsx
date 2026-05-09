import { ResetPasswordForm } from "./components/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    code?: string | string[];
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const code = Array.isArray(params.code) ? params.code[0] : (params.code ?? "");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Новый пароль</h1>
        <ResetPasswordForm code={code} />
      </section>
    </main>
  );
}

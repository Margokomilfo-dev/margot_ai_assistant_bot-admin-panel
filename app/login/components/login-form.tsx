"use client";

import { useActionState, useState } from "react";

import { PasswordRecoveryForm } from "./password-recovery-form";
import { loginAction } from "../actions";
import type { LoginFormState } from "../types";

const initialState: LoginFormState = {
  error: null,
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  return (
    <>
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Логин
          </label>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="username"
            className="mt-2 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-2 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
            required
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Проверяем..." : "Войти"}
        </button>

        {state.error ? (
          <p className="text-sm font-medium text-red-600" aria-live="polite">
            {state.error}
          </p>
        ) : null}
      </form>

      <button
        type="button"
        onClick={() => setIsRecoveryOpen((currentValue) => !currentValue)}
        className="mt-4 text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
      >
        Забыли пароль?
      </button>

      {isRecoveryOpen ? <PasswordRecoveryForm /> : null}
    </>
  );
}

"use client";

import { useActionState } from "react";

import {
  sendPasswordRecoveryEmail,
  type PasswordRecoveryState,
} from "../password-recovery-actions";

const initialState: PasswordRecoveryState = {
  error: null,
  message: null,
};

export function PasswordRecoveryForm() {
  const [state, formAction, isPending] = useActionState(
    sendPasswordRecoveryEmail,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-4 space-y-4 border-t border-slate-200 pt-4"
    >
      <div>
        <label
          htmlFor="recovery-email"
          className="block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          className="mt-2 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {isPending ? "Отправляем..." : "Отправить ссылку"}
      </button>

      {state.error ? (
        <p className="text-sm font-medium text-red-600" aria-live="polite">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="text-sm font-medium text-emerald-700" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

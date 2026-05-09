"use client";

import { useActionState, useRef } from "react";

import { updatePasswordAction } from "../actions";

import type { ResetPasswordState } from "../actions";

const initialState: ResetPasswordState = {
  error: null,
};

type ResetPasswordFormProps = {
  code: string;
};

export function ResetPasswordForm({ code }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialState,
  );
  const accessTokenInputRef = useRef<HTMLInputElement>(null);
  const refreshTokenInputRef = useRef<HTMLInputElement>(null);

  function addRecoveryTokensFromHash() {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token") ?? "";
    const refreshToken = hashParams.get("refresh_token") ?? "";

    if (accessTokenInputRef.current) {
      accessTokenInputRef.current.value = accessToken;
    }

    if (refreshTokenInputRef.current) {
      refreshTokenInputRef.current.value = refreshToken;
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={addRecoveryTokensFromHash}
      className="mt-6 space-y-4"
    >
      <input type="hidden" name="code" value={code} />
      <input ref={accessTokenInputRef} type="hidden" name="accessToken" />
      <input ref={refreshTokenInputRef} type="hidden" name="refreshToken" />

      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-slate-700"
        >
          Новый пароль
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="mt-2 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
          required
        />
      </div>

      <div>
        <label
          htmlFor="repeat-password"
          className="block text-sm font-medium text-slate-700"
        >
          Повтор пароля
        </label>
        <input
          id="repeat-password"
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          className="mt-2 block h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? "Обновляем..." : "Обновить пароль"}
      </button>

      {state.error ? (
        <p className="text-sm font-medium text-red-600" aria-live="polite">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

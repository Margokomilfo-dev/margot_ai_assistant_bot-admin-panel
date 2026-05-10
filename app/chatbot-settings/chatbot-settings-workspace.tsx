"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  deleteChatbotInstructionAction,
  saveChatbotInstructionAction,
} from "./actions";
import type { getChatbotInstructions } from "./queries";

type ChatbotInstruction = Awaited<
  ReturnType<typeof getChatbotInstructions>
>[number];

type ChatbotSettingsWorkspaceProps = {
  instructions: ChatbotInstruction[];
};

const emptyInstruction = {
  created_at: null,
  fallback_reply: "",
  id: "",
  is_active: true,
  match_count: 3,
  match_threshold: 0.35,
  max_output_tokens: 500,
  metadata: {},
  model: "gpt-4.1-mini",
  name: "",
  system_prompt: "",
  temperature: 0.4,
  updated_at: null,
};

export function ChatbotSettingsWorkspace({
  instructions,
}: ChatbotSettingsWorkspaceProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(instructions[0]?.id ?? "");
  const selectedInstruction = useMemo(
    () => instructions.find((instruction) => instruction.id === selectedId),
    [instructions, selectedId],
  );
  const [draft, setDraft] = useState(selectedInstruction ?? emptyInstruction);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function selectInstruction(instruction: ChatbotInstruction) {
    setSelectedId(instruction.id);
    setDraft(instruction);
    setErrorMessage(null);
    setMessage(null);
  }

  function createInstruction() {
    setSelectedId("");
    setDraft(emptyInstruction);
    setErrorMessage(null);
    setMessage(null);
  }

  function saveInstruction() {
    setErrorMessage(null);
    setMessage(null);

    startTransition(async () => {
      const result = await saveChatbotInstructionAction({
        fallback_reply: draft.fallback_reply,
        id: selectedId || undefined,
        is_active: draft.is_active,
        match_count: draft.match_count,
        match_threshold: draft.match_threshold,
        max_output_tokens: draft.max_output_tokens,
        metadata: draft.metadata,
        model: draft.model,
        name: draft.name,
        system_prompt: draft.system_prompt,
        temperature: draft.temperature,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setMessage("Настройки чатбота сохранены.");
      router.refresh();
    });
  }

  function deleteInstruction() {
    if (!selectedId) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteChatbotInstructionAction({ id: selectedId });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      createInstruction();
      router.refresh();
    });
  }

  return (
    <section className="min-h-[calc(100vh-5.75rem)] rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
      <div className="grid min-h-[calc(100vh-5.85rem)] grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-[#f7f8fa] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Инструкции</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {instructions.length} записей
              </p>
            </div>
            <button
              type="button"
              onClick={createInstruction}
              className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Новая
            </button>
          </div>

          <div className="space-y-1">
            {instructions.map((instruction) => {
              const isActive = instruction.id === selectedId;

              return (
                <button
                  key={instruction.id}
                  type="button"
                  onClick={() => selectInstruction(instruction)}
                  className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-slate-200"
                      : "hover:bg-white"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-950">
                      {instruction.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${
                        instruction.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-500 ring-slate-200"
                      }`}
                    >
                      {instruction.is_active ? "on" : "off"}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">
                    {instruction.model}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 bg-[#f7f9fb] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Chatbot settings
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Prompt и внутреннее поведение
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedId ? (
                <button
                  type="button"
                  onClick={deleteInstruction}
                  disabled={isPending}
                  className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Удалить
                </button>
              ) : null}
              <button
                type="button"
                onClick={saveInstruction}
                disabled={isPending}
                className="h-9 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isPending ? "Сохранение" : "Сохранить"}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}
          {message ? (
            <p className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Название
                </span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Модель
                </span>
                <input
                  value={draft.model}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                System prompt
              </span>
              <textarea
                value={draft.system_prompt}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    system_prompt: event.target.value,
                  }))
                }
                className="min-h-80 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-slate-950"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Fallback reply
              </span>
              <textarea
                value={draft.fallback_reply}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    fallback_reply: event.target.value,
                  }))
                }
                className="min-h-24 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-slate-950"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Threshold
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={draft.match_threshold}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      match_threshold: Number(event.target.value),
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Match count
                </span>
                <input
                  type="number"
                  value={draft.match_count}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      match_count: Number(event.target.value),
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Max tokens
                </span>
                <input
                  type="number"
                  value={draft.max_output_tokens}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      max_output_tokens: Number(event.target.value),
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Temperature
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.temperature}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      temperature: Number(event.target.value),
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
              />
              Активна
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

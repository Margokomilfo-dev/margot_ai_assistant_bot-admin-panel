"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  deleteTelegramMenuItemAction,
  saveTelegramMenuItemAction,
} from "./actions";
import type { getTelegramMenuItems } from "./queries";

type TelegramMenuItem = Awaited<ReturnType<typeof getTelegramMenuItems>>[number];

type TelegramSettingsWorkspaceProps = {
  menuItems: TelegramMenuItem[];
};

const emptyMenuItem = {
  action_type: "reply",
  id: "",
  is_active: true,
  label: "",
  reply_text: "",
  sort_order: 0,
  updated_at: null,
};

export function TelegramSettingsWorkspace({
  menuItems,
}: TelegramSettingsWorkspaceProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(menuItems[0]?.id ?? "");
  const selectedMenuItem = useMemo(
    () => menuItems.find((item) => item.id === selectedId),
    [menuItems, selectedId],
  );
  const [draft, setDraft] = useState(selectedMenuItem ?? emptyMenuItem);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function selectMenuItem(menuItem: TelegramMenuItem) {
    setSelectedId(menuItem.id);
    setDraft(menuItem);
    setErrorMessage(null);
    setMessage(null);
  }

  function createMenuItem() {
    setSelectedId("");
    setDraft(emptyMenuItem);
    setErrorMessage(null);
    setMessage(null);
  }

  function saveMenuItem() {
    setErrorMessage(null);
    setMessage(null);

    startTransition(async () => {
      const result = await saveTelegramMenuItemAction({
        action_type: draft.action_type,
        id: selectedId || undefined,
        is_active: draft.is_active,
        label: draft.label,
        reply_text: draft.reply_text,
        sort_order: draft.sort_order,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setMessage("Настройки Telegram-меню сохранены.");
      router.refresh();
    });
  }

  function deleteMenuItem() {
    if (!selectedId) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteTelegramMenuItemAction({ id: selectedId });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      createMenuItem();
      router.refresh();
    });
  }

  return (
    <section className="min-h-[calc(100vh-5.75rem)] rounded-md border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
      <div className="grid min-h-[calc(100vh-5.85rem)] grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-[#f7f8fa] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Пункты меню</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {menuItems.length} записей
              </p>
            </div>
            <button
              type="button"
              onClick={createMenuItem}
              className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Новый
            </button>
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const isSelected = item.id === selectedId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectMenuItem(item)}
                  className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-white shadow-sm ring-1 ring-slate-200"
                      : "hover:bg-white"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-950">
                      {item.label}
                    </span>
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500 ring-1 ring-slate-200">
                      {item.sort_order}
                    </span>
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
                Telegram settings
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Меню и действия бота
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedId ? (
                <button
                  type="button"
                  onClick={deleteMenuItem}
                  disabled={isPending}
                  className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Удалить
                </button>
              ) : null}
              <button
                type="button"
                onClick={saveMenuItem}
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
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Название кнопки
                </span>
                <input
                  value={draft.label}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  Порядок
                </span>
                <input
                  type="number"
                  value={draft.sort_order}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sort_order: Number(event.target.value),
                    }))
                  }
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
                />
              </label>
            </div>

            <label className="grid max-w-md gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Тип действия
              </span>
              <select
                value={draft.action_type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    action_type: event.target.value,
                  }))
                }
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-950"
              >
                <option value="reply">Ответить текстом</option>
                <option value="knowledge_search">Искать в базе знаний</option>
                <option value="handoff">Передать менеджеру</option>
                <option value="open_flow">Открыть сценарий</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Ответ или описание действия
              </span>
              <textarea
                value={draft.reply_text ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    reply_text: event.target.value,
                  }))
                }
                className="min-h-72 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-slate-950"
              />
            </label>

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
              Активен в Telegram
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

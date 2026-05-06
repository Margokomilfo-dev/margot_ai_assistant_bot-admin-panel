"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { markClientMessagesAsRead, sendManagerReplyAction } from "./actions";

type ReplyComposerProps = {
  clientId: string;
  unreadCount: number;
  canReply: boolean;
  disabledReason: string | null;
};

// Черновик хранится отдельно для каждого клиента, чтобы текст не переносился между диалогами.
function getDraftStorageKey(clientId: string) {
  return `messages:reply-draft:${clientId}`;
}

// Нижняя форма ответа: хранит черновик, помечает unread и отправляет сообщение.
export function ReplyComposer({
  clientId,
  unreadCount,
  canReply,
  disabledReason,
}: ReplyComposerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(getDraftStorageKey(clientId)) ?? "";
  });
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();

  // Сообщения становятся прочитанными только когда менеджер реально начал отвечать.
  function markAsReadOnReplyStart() {
    if (!canReply || unreadCount === 0 || hasMarkedRead) {
      return;
    }

    setHasMarkedRead(true);
    void markClientMessagesAsRead(clientId)
      .then(() => {
        router.refresh();
      })
      .catch((error: unknown) => {
        setHasMarkedRead(false);
        console.error("Failed to mark messages as read.", error);
      });
  }

  // Сохраняем черновик в localStorage и восстанавливаем его при возврате к диалогу.
  function handleDraftChange(value: string) {
    if (value.trim()) {
      markAsReadOnReplyStart();
    }

    setDraft(value);

    const storageKey = getDraftStorageKey(clientId);

    if (value) {
      window.localStorage.setItem(storageKey, value);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }

  // Отправка доступна только назначенному менеджеру.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const replyText = draft.trim();

    if (!canReply || !replyText || isSending) {
      return;
    }

    setErrorMessage(null);

    startSending(async () => {
      try {
        const result = await sendManagerReplyAction(clientId, replyText);

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        const storageKey = getDraftStorageKey(clientId);

        setDraft("");
        window.localStorage.removeItem(storageKey);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to send message.",
        );
      }
    });
  }

  return (
    <form
      action="#"
      onSubmit={handleSubmit}
      className="border-t border-slate-200 bg-white px-3 py-2.5"
    >
      {disabledReason ? (
        <p className="mb-2 text-xs font-medium text-slate-500">
          {disabledReason}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mb-2 text-xs font-medium text-red-600">{errorMessage}</p>
      ) : null}
      <div
        className={`flex items-end gap-2 rounded-md border px-2.5 py-1.5 shadow-inner ${
          canReply
            ? "border-slate-200 bg-slate-50"
            : "border-slate-200 bg-slate-100"
        }`}
      >
        <textarea
          rows={2}
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value)}
          placeholder={
            canReply
              ? "Write a reply to the client..."
              : "Assign this client to yourself before replying..."
          }
          disabled={!canReply}
          className="min-h-8 flex-1 resize-none bg-transparent text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={!canReply || !draft.trim() || isSending}
          className="rounded-md bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSending ? "Sending" : "Send"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useRef } from "react";

import {
  formatMessageDay,
  formatMessageTime,
  getMessageDayKey,
} from "../lib/utils";
import type { Message } from "../types";

type MessageListProps = {
  messages: Message[];
};

// Список сообщений группирует чат по дням и держит scroll на последнем сообщении.
export function MessageList({ messages }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Группы по датам дают разделители в стиле реального чата.
  const messageGroups = messages.reduce<
    Array<{ key: string; label: string; messages: Message[] }>
  >((groups, message) => {
    const key = getMessageDayKey(message.created_at);
    const currentGroup = groups.at(-1);

    if (currentGroup?.key === key) {
      currentGroup.messages.push(message);
      return groups;
    }

    groups.push({
      key,
      label: formatMessageDay(message.created_at),
      messages: [message],
    });

    return groups;
  }, []);

  // При смене диалога или приходе нового сообщения показываем нижнюю часть переписки.
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer) {
      return;
    }

    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5"
    >
      <div className="space-y-2.5">
        {messageGroups.map((group) => (
          <section key={group.key} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-slate-300/80" />
              <time className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                {group.label}
              </time>
              <span className="h-px flex-1 bg-slate-300/80" />
            </div>

            <div className="rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">
              {group.messages.map((message) => {
                const isManagerReply = message.direction === "outgoing";
                // Подсветка нужна только для новых входящих сообщений клиента.
                const isUnreadClientMessage =
                  message.direction === "incoming" && !message.read_at;

                return (
                  <article
                    key={message.id}
                    className={`border-b last:border-b-0 ${
                      isUnreadClientMessage
                        ? "border-slate-300 bg-slate-900/[0.06]"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="relative py-1.5 pr-14 text-slate-900">
                      <div
                        className={`flex min-w-0 items-start gap-2 ${
                          isManagerReply ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isUnreadClientMessage ? (
                          <span className="mt-2 h-4 w-1 shrink-0 rounded-full bg-slate-950" />
                        ) : null}
                        <div
                          className={`max-w-[86%] rounded-md px-2.5 py-1.5 ${
                            isManagerReply
                              ? "bg-slate-950 text-white"
                              : "bg-white text-slate-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-left text-sm leading-5">
                            {message.text}
                          </p>
                        </div>
                      </div>
                      <time className="absolute right-0 bottom-2.5 text-right text-[10px] font-medium leading-none text-slate-400">
                        {formatMessageTime(message.created_at)}
                      </time>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Невидимый компонент держит Realtime-подписку и обновляет серверные данные страницы.
export function MessagesRealtime() {
  const router = useRouter();
  const realtimeScope = "all-messages";

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      console.warn(
        "Supabase Realtime is disabled: missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    // Быстрая диагностика: если browser client не читает messages, Realtime тоже не заработает.
    void supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .then(({ error }) => {
        if (error) {
          console.error(
            "Browser Supabase client cannot read messages. Realtime may be blocked by RLS.",
            error,
          );
        } else {
          console.info("Browser Supabase client can read messages.");
        }
      });

    // Слушаем все новые сообщения, потому что новый клиент тоже должен появиться в списке.
    const subscriptionConfig = {
      event: "INSERT" as const,
      schema: "public",
      table: "messages",
    };

    const channel = supabase
      .channel("messages-inserts")
      .on(
        "postgres_changes",
        subscriptionConfig,
        () => {
          // router.refresh заново получает server data без полной перезагрузки страницы.
          router.refresh();
        },
      )
      .subscribe((status, error) => {
        console.info("Messages realtime status:", status);

        if (status === "SUBSCRIBED") {
          console.info("Subscribed to messages realtime updates.");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Messages realtime subscription failed.", {
            status,
            error,
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, realtimeScope]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Невидимый компонент держит Realtime-подписку и обновляет серверные данные страницы.
export function MessagesRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let isActive = true;
    let messagesChannel:
      | ReturnType<
          NonNullable<ReturnType<typeof createSupabaseBrowserClient>>["channel"]
        >
      | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    if (!supabase) {
      console.warn(
        "Supabase Realtime is disabled: missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
      );
      return;
    }

    const supabaseClient = supabase;

    console.info("Realtime client initialized:", {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasPublishableKey: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ),
    });

    function refreshMessagesPage() {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        // router.refresh заново получает server data без полной перезагрузки страницы.
        router.refresh();
      }, 100);
    }

    async function subscribeToMessages() {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Realtime auth session check failed.", error);
        return;
      }

      if (data.session?.access_token) {
        supabaseClient.realtime.setAuth(data.session.access_token);
      }

      console.info("Realtime auth session:", {
        hasSession: Boolean(data.session),
        userId: data.session?.user.id ?? null,
      });

      // Быстрая диагностика: если browser client не читает messages, Realtime тоже не заработает.
      const { error: messagesReadError } = await supabaseClient
        .from("messages")
        .select("id", { count: "exact", head: true });

      if (!isActive) {
        return;
      }

      if (messagesReadError) {
        console.error(
          "Browser Supabase client cannot read messages. Realtime may be blocked by RLS.",
          messagesReadError,
        );
      } else {
        console.info("Browser Supabase client can read messages.");
      }

      // Слушаем любые изменения messages: новые сообщения, read/status updates,
      // fallback handoff flags и удаления должны обновлять серверные данные страницы.
      messagesChannel = supabaseClient
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            console.log("Realtime payload:", payload);
            refreshMessagesPage();
          },
        )
        .subscribe((status, error) => {
          console.log("Realtime status:", status);

          if (status === "SUBSCRIBED") {
            console.info("Subscribed to all messages realtime changes.");
          }

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Messages realtime subscription failed.", {
              status,
              error,
            });
          }
        });
    }

    void subscribeToMessages();

    return () => {
      isActive = false;

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      if (messagesChannel) {
        void supabaseClient.removeChannel(messagesChannel);
      }
    };
  }, [router]);

  return null;
}

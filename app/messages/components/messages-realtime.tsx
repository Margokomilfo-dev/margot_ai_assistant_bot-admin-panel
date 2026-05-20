"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type MessagesRealtimeProps = {
  unreadCount: number;
};

type RealtimeMessageRow = {
  direction?: unknown;
  sender_type?: unknown;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function isIncomingClientMessage(record: unknown) {
  if (!record || typeof record !== "object") {
    return false;
  }

  const message = record as RealtimeMessageRow;

  return message.direction === "incoming" || message.sender_type === "client";
}

function getBadgeNavigator() {
  return navigator as Navigator & {
    clearAppBadge?: () => Promise<void>;
    setAppBadge?: (contents?: number) => Promise<void>;
  };
}

function playNotificationTone(audioContextRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const audioWindow = window as AudioWindow;
    const AudioContextConstructor =
      audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext =
      audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  } catch (error) {
    console.warn("Unable to play notification sound.", error);
  }
}

// Невидимый компонент держит Realtime-подписку и обновляет серверные данные страницы.
export function MessagesRealtime({ unreadCount }: MessagesRealtimeProps) {
  const router = useRouter();
  const [optimisticUnreadCount, setOptimisticUnreadCount] =
    useState(unreadCount);
  const audioContextRef = useRef<AudioContext | null>(null);
  const baseTitleRef = useRef<string | null>(null);

  useEffect(() => {
    setOptimisticUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!baseTitleRef.current) {
      baseTitleRef.current = document.title.replace(/^\(\d+\)\s+/, "");
    }

    const title = baseTitleRef.current;
    document.title =
      optimisticUnreadCount > 0
        ? `(${optimisticUnreadCount}) ${title}`
        : title;

    const badgeNavigator = getBadgeNavigator();

    if (optimisticUnreadCount > 0) {
      void badgeNavigator.setAppBadge?.(optimisticUnreadCount);
    } else {
      void badgeNavigator.clearAppBadge?.();
    }
  }, [optimisticUnreadCount]);

  useEffect(() => {
    function unlockAudio() {
      const audioWindow = window as AudioWindow;
      const AudioContextConstructor =
        audioWindow.AudioContext || audioWindow.webkitAudioContext;

      if (!AudioContextConstructor || audioContextRef.current) {
        return;
      }

      audioContextRef.current = new AudioContextConstructor();
      void audioContextRef.current.resume();
    }

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

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
            if (
              payload.eventType === "INSERT" &&
              isIncomingClientMessage(payload.new)
            ) {
              setOptimisticUnreadCount((count) => count + 1);
              playNotificationTone(audioContextRef);
            }

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

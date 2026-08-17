import { useCallback, useEffect, useRef, useState } from "react";
import { playIncomingChime, playOutgoingTick, showMobileNotification } from "@/lib/notify";


export type LiveMessage = {
  id: string;
  chatId: string;
  from: "me" | "them";
  author: string;
  text: string;
  ts: number;
};

type Status = "connecting" | "live" | "offline";

export function useLiveMessages() {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const since = useRef(0);
  const firstLoad = useRef(true);

  const merge = useCallback((incoming: LiveMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      if (!firstLoad.current) {
        const received = fresh.filter((m) => m.from === "them");
        const last = received[received.length - 1];
        if (last) {
          playIncomingChime();
          showMobileNotification(
            `🔔 הודעה חדשה מ${last.author}`,
            last.text.replace(/[*_~`]/g, "").slice(0, 120),
          );
        }

      }
      const next = [...prev, ...fresh];
      next.sort((a, b) => a.ts - b.ts);
      return next;
    });
    since.current = Math.max(since.current, ...incoming.map((m) => m.ts));
  }, []);


  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/public/messages?since=${since.current}`);
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as { messages: LiveMessage[] };
        if (cancelled) return;
        merge(data.messages);
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };
    void poll();
    const timer = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [merge]);

  const send = useCallback(
    async (payload: { chatId: string; text: string; from?: "me" | "them"; author?: string }) => {
      const res = await fetch("/api/public/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("send failed");
      const data = (await res.json()) as { message: LiveMessage };
      merge([data.message]);
      return data.message;
    },
    [merge],
  );

  return { messages, status, send };
}

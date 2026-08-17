import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CheckCheck, Send, Smile, Phone, AlertCircle, RefreshCw } from "lucide-react";
import { CONTACTS, EMOJI_KIT } from "@/lib/hs-data";
import { formatTime, prettyPhone, renderWhatsApp } from "@/lib/hs-format";
import type { LiveMessage } from "@/hooks/use-live-messages";

type Props = {
  messages: LiveMessage[];
  send: (p: { chatId: string; text: string; from?: "me" | "them" }) => Promise<unknown>;
  activeChat: string | null;
  setActiveChat: (id: string | null) => void;
  serverUrl?: string;
};

export function ChatSim({ messages, send, activeChat, setActiveChat, serverUrl = "http://localhost:8787" }: Props) {
  const [serverStatus, setServerStatus] = useState<string>("checking"); // checking | ready | disconnected | error
  const [hasQr, setHasQr] = useState<boolean>(false);

  // בדיקת סטטוס חיבור מול השרת המקומי
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${serverUrl}/status`);
        if (res.ok) {
          const data = await res.json();
          setServerStatus(data.status || "ready");
          setHasQr(data.hasQr || false);
        } else {
          setServerStatus("disconnected");
        }
      } catch {
        setServerStatus("error");
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  const chats = useMemo(() => {
    const ids = new Set([...Object.keys(CONTACTS), ...messages.map((m) => m.chatId)]);
    return [...ids]
      .map((id) => {
        const list = messages.filter((m) => m.chatId === id);
        const last = list[list.length - 1];
        return { id, name: CONTACTS[id] ?? prettyPhone(id), last, count: list.length };
      })
      .sort((a, b) => (b.last?.ts ?? 0) - (a.last?.ts ?? 0));
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* חיווי סטטוס חיבור לשרת הוואטסאפ במידה ויש בעיה */}
      {serverStatus !== "ready" && (
        <div className="flex items-center justify-between bg-destructive/15 px-4 py-2 text-xs text-destructive border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              {serverStatus === "checking" && "בודק חיבור לשרת וואטסאפ..."}
              {serverStatus === "disconnected" && "שרת הוואטסאפ מנותק או טרם הופעל."}
              {serverStatus === "error" && "לא ניתן ליצור קשר עם שרת הוואטסאפ המקומי (C:\\new)."}
            </span>
          </div>
          <a
            href={`${serverUrl}/qr`}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-destructive px-2 py-1 font-semibold text-destructive-foreground hover:bg-destructive/90"
          >
            סרוק QR 📱
          </a>
        </div>
      )}

      {!activeChat ? (
        <div className="divide-y divide-border overflow-y-auto flex-1">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors active:bg-muted"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand/15 text-lg font-bold text-brand">
                {c.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold text-foreground">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {c.last ? formatTime(c.last.ts) : ""}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {c.last ? c.last.text.replace(/[*_~`]/g, "").split("\n")[0] : "אין הודעות עדיין"}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <ChatRoom
          chatId={activeChat}
          messages={messages.filter((m) => m.chatId === activeChat)}
          send={send}
          onBack={() => setActiveChat(null)}
          serverStatus={serverStatus}
        />
      )}
    </div>
  );
}

function ChatRoom({
  chatId,
  messages,
  send,
  onBack,
  serverStatus,
}: {
  chatId: string;
  messages: LiveMessage[];
  send: Props["send"];
  onBack: () => void;
  serverStatus: string;
}) {
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    setText("");
    await send({ chatId, text: value, from: "me" });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 bg-brand-deep px-3 py-2 text-brand-foreground">
        <button onClick={onBack} aria-label="חזרה" className="p-1">
          <ArrowRight className="size-5" />
        </button>
        <span className="grid size-9 place-items-center rounded-full bg-brand/40 font-bold">
          {(CONTACTS[chatId] ?? "?").slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{CONTACTS[chatId] ?? prettyPhone(chatId)}</p>
          <p className="text-[11px] opacity-80">
            {serverStatus === "ready" ? "מחובר לוואטסאפ ✅" : "ממתין לחיבור שרת ⚠️"}
          </p>
        </div>
        <Phone className="size-5 opacity-90" />
      </header>

      <div className="chat-canvas flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => (
          <div key={m.id} className={m.from === "me" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                m.from === "me"
                  ? "rounded-bl-sm bg-bubble-out text-foreground"
                  : "rounded-br-sm bg-bubble-in text-foreground"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{renderWhatsApp(m.text)}</div>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                {formatTime(m.ts)}
                {m.from === "me" ? (
                  <CheckCheck className="size-3 text-info" />
                ) : (
                  <Check className="size-3" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {emoji && (
        <div className="grid grid-cols-8 gap-1 border-t border-border bg-card p-2 text-xl">
          {EMOJI_KIT.map((e) => (
            <button key={e} onClick={() => setText((t) => t + e)} className="rounded p-1 active:bg-muted">
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border bg-card p-2">
        <button
          onClick={() => setEmoji((v) => !v)}
          aria-label="אימוג׳י"
          className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        >
          <Smile className="size-5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="הקלד הודעה לוואטסאפ..."
          className="max-h-28 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          onClick={submit}
          aria-label="שלח"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground active:scale-95"
        >
          <Send className="size-5 rotate-180" />
        </button>
      </div>
    </div>
  );
}

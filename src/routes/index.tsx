import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutGrid, MessageCircle, Palette } from "lucide-react";
import { ChatSim } from "@/components/hs/ChatSim";
import { Studio } from "@/components/hs/Studio";
import { Crm } from "@/components/hs/Crm";
import { useLiveMessages } from "@/hooks/use-live-messages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ח. סבן | סטודיו הודעות וואטסאפ ו-CRM הובלות" },
      {
        name: "description",
        content:
          "אפליקציית מובייל בעברית לניהול הובלות: סימולטור וואטסאפ בזמן אמת, סטודיו לעיצוב הודעות עם אימוג׳י וטקסט מודגש, ודוח בוקר אוטומטי ב-06:30.",
      },
      { property: "og:title", content: "ח. סבן | סטודיו הודעות וואטסאפ ו-CRM הובלות" },
      {
        property: "og:description",
        content: "סימולטור וואטסאפ, סטודיו עיצוב הודעות ודוח בוקר אוטומטי לעסק ההובלות.",
      },
    ],
  }),
  component: Index,
});

type Tab = "chats" | "studio" | "crm";

function Index() {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { messages, status, send } = useLiveMessages();

  const openChat = (chatId: string) => {
    setActiveChat(chatId);
    setTab("chats");
  };

  return (
    <div dir="rtl" className="min-h-dvh bg-muted">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background shadow-xl">
        <header className="sticky top-0 z-10 bg-brand-deep px-4 py-3 text-brand-foreground">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-lg font-bold">🧰 ח. סבן · מרכז הודעות</h1>
              <p className="text-[11px] opacity-85">וואטסאפ · CRM · דוח בוקר 06:30</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-brand/25 px-2.5 py-1 text-[11px] font-semibold">
              <span
                className={`size-2 rounded-full ${
                  status === "live"
                    ? "animate-pulse bg-brand-foreground"
                    : status === "connecting"
                      ? "bg-warning"
                      : "bg-destructive"
                }`}
              />
              {status === "live" ? "מחובר לשרת" : status === "connecting" ? "מתחבר..." : "מנותק"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden pb-20">
          {tab === "chats" && (
            <div className="h-[calc(100dvh-9.5rem)]">
              <ChatSim
                messages={messages}
                send={send}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
              />
            </div>
          )}
          {tab === "studio" && <Studio send={send} onSent={openChat} />}
          {tab === "crm" && <Crm send={send} onSent={openChat} />}
        </main>

        <nav className="fixed bottom-0 z-20 w-full max-w-md border-t border-border bg-card">
          <div className="grid grid-cols-3">
            <TabBtn
              active={tab === "chats"}
              onClick={() => setTab("chats")}
              icon={<MessageCircle className="size-5" />}
              label="צ׳אטים"
            />
            <TabBtn
              active={tab === "studio"}
              onClick={() => setTab("studio")}
              icon={<Palette className="size-5" />}
              label="סטודיו"
            />
            <TabBtn
              active={tab === "crm"}
              onClick={() => setTab("crm")}
              icon={<LayoutGrid className="size-5" />}
              label="CRM"
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
        active ? "text-brand" : "text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

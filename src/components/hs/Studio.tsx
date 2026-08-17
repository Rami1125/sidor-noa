import { useState } from "react";
import { Bold, Code2, Italic, SendHorizontal, Strikethrough, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EMOJI_KIT, TEMPLATES } from "@/lib/hs-data";
import { formatTime, normalizePhone, renderWhatsApp } from "@/lib/hs-format";

type Props = {
  send: (p: { chatId: string; text: string; from?: "me" | "them" }) => Promise<unknown>;
  onSent: (chatId: string) => void;
};

export function Studio({ send, onSent }: Props) {
  const [phone, setPhone] = useState("050-123-4567");
  const [body, setBody] = useState(
    "🧰 *ח. סבן - שירותי הובלה*\n\nשלום 👋\nהמשאית שלנו יוצאת אליך _היום_ בשעה 14:00.\n\n📦 מטען: 12 משטחים\n🛣️ אשדוד ← חיפה",
  );
  const [busy, setBusy] = useState(false);

  const wrap = (mark: string) => setBody((b) => `${b}${mark}טקסט${mark}`);

  const handleSend = async () => {
    const chatId = normalizePhone(phone);
    if (chatId.length < 11) {
      toast.error("מספר טלפון לא תקין 📵");
      return;
    }
    if (!body.trim()) {
      toast.error("ההודעה ריקה");
      return;
    }
    setBusy(true);
    try {
      await send({ chatId, text: body, from: "me" });
      toast.success("ההודעה נשלחה לשרת בזמן אמת ✅");
      onSent(chatId);
    } catch {
      toast.error("שליחה נכשלה - בדוק את החיבור לשרת");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <section className="surface-card p-4">
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">
          📞 מספר יעד (וואטסאפ)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          dir="ltr"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-center font-mono text-sm outline-none focus:border-brand"
        />
      </section>

      <section className="surface-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold">🧰 כלי עיצוב הודעה</h2>
          <span className="text-[11px] text-muted-foreground">תחביר וואטסאפ</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolBtn icon={<Bold className="size-4" />} label="מודגש" onClick={() => wrap("*")} />
          <ToolBtn icon={<Italic className="size-4" />} label="נטוי" onClick={() => wrap("_")} />
          <ToolBtn
            icon={<Strikethrough className="size-4" />}
            label="קו חוצה"
            onClick={() => wrap("~")}
          />
          <ToolBtn icon={<Code2 className="size-4" />} label="קוד" onClick={() => wrap("`")} />
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1 text-xl">
          {EMOJI_KIT.map((e) => (
            <button
              key={e}
              onClick={() => setBody((b) => b + e)}
              className="rounded-lg p-1 active:bg-muted"
            >
              {e}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:border-brand"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => setBody(t.body)}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground active:scale-95"
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
          <Sparkles className="size-4 text-brand" /> תצוגה מקדימה חיה
        </div>
        <div className="chat-canvas p-3">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-bubble-out px-3 py-2 text-sm leading-relaxed shadow-sm">
            <div className="whitespace-pre-wrap break-words">{renderWhatsApp(body)}</div>
            <div className="mt-1 text-left text-[10px] text-muted-foreground">
              {formatTime(Date.now())} ✓✓
            </div>
          </div>
        </div>
      </section>

      <button
        onClick={handleSend}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 font-display font-bold text-brand-foreground shadow-lg active:scale-[0.98] disabled:opacity-60"
      >
        <SendHorizontal className="size-5 rotate-180" />
        {busy ? "שולח..." : "שלח הודעה לשרת"}
      </button>
    </div>
  );
}

function ToolBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium active:bg-muted"
    >
      {icon}
      {label}
    </button>
  );
}

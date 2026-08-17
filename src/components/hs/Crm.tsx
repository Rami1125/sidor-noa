import { useMemo, useState } from "react";
import { AlarmClock, Send, Truck } from "lucide-react";
import { toast } from "sonner";
import { ORDERS, STATUS_META, buildMorningReport, type OrderStatus } from "@/lib/hs-data";
import { renderWhatsApp } from "@/lib/hs-format";

type Props = {
  send: (p: { chatId: string; text: string; from?: "me" | "them" }) => Promise<unknown>;
  onSent: (chatId: string) => void;
};

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "pending", label: "🕒 ממתין" },
  { key: "in_progress", label: "🚚 בביצוע" },
  { key: "done", label: "✅ הושלם" },
];

export function Crm({ send, onSent }: Props) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const report = useMemo(() => buildMorningReport(ORDERS), []);
  const orders = ORDERS.filter((o) => filter === "all" || o.status === filter);
  const pending = ORDERS.filter((o) => o.status === "pending").length;

  const sendReport = async () => {
    await send({ chatId: "972500000000", text: report, from: "me" });
    toast.success("דוח הבוקר נשלח לקבוצה 📅");
    onSent("972500000000");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat value={pending} label="ממתינות" emoji="🕒" />
        <Stat value={ORDERS.filter((o) => o.status === "in_progress").length} label="בדרך" emoji="🚚" />
        <Stat value={ORDERS.filter((o) => o.status === "done").length} label="הושלמו" emoji="✅" />
      </div>

      <section className="surface-card p-4">
        <div className="flex items-center gap-2">
          <AlarmClock className="size-5 text-brand" />
          <h2 className="font-display text-sm font-bold">דוח בוקר אוטומטי · 06:30</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          מופעל מדי יום בשעה 06:30 (אסיה/ירושלים) ונשלח לקבוצת הוואטסאפ.
        </p>
        <div className="chat-canvas mt-3 rounded-xl p-3">
          <div className="ml-auto max-w-[92%] rounded-2xl rounded-bl-sm bg-bubble-out px-3 py-2 text-sm leading-relaxed shadow-sm">
            <div className="whitespace-pre-wrap">{renderWhatsApp(report)}</div>
          </div>
        </div>
        <button
          onClick={sendReport}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-brand-foreground active:scale-[0.98]"
        >
          <Send className="size-4 rotate-180" /> שלח עכשיו לקבוצה
        </button>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {orders.map((o) => {
          const meta = STATUS_META[o.status];
          return (
            <li key={o.id} className="surface-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold">{o.sender}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                  {meta.emoji} {meta.label}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="size-3.5" />
                {o.from} ← {o.to} · {o.cargo}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {o.id} · {o.date}
                </span>
                <button
                  onClick={async () => {
                    await send({
                      chatId: o.phone,
                      from: "me",
                      text: `✅ *עדכון הזמנה ${o.id}*\n\n📦 ${o.cargo}\n🛣️ ${o.from} ← ${o.to}\n🕒 סטטוס: *${meta.label}*`,
                    });
                    toast.success(`עדכון נשלח ל${o.sender} ✅`);
                    onSent(o.phone);
                  }}
                  className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground active:scale-95"
                >
                  שלח עדכון
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  return (
    <div className="surface-card p-3 text-center">
      <div className="text-lg">{emoji}</div>
      <div className="font-display text-xl font-bold text-brand">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

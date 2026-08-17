export type OrderStatus = "pending" | "in_progress" | "done";

export type Order = {
  id: string;
  sender: string;
  phone: string;
  from: string;
  to: string;
  cargo: string;
  date: string;
  status: OrderStatus;
};

export const STATUS_META: Record<OrderStatus, { label: string; emoji: string; className: string }> =
  {
    pending: { label: "ממתין", emoji: "🕒", className: "bg-warning/15 text-warning" },
    in_progress: { label: "בביצוע", emoji: "🚚", className: "bg-info/15 text-info" },
    done: { label: "הושלם", emoji: "✅", className: "bg-brand/15 text-brand" },
  };

export const ORDERS: Order[] = [
  {
    id: "HS-1041",
    sender: "משה לוי",
    phone: "972501234567",
    from: "אשדוד",
    to: "חיפה",
    cargo: "12 משטחים",
    date: "17/08",
    status: "pending",
  },
  {
    id: "HS-1042",
    sender: "דנה כהן",
    phone: "972529876543",
    from: "ראשל״צ",
    to: "ב״ש",
    cargo: "מכולה 20 רגל",
    date: "17/08",
    status: "pending",
  },
  {
    id: "HS-1043",
    sender: "אלי מזרחי",
    phone: "972541112233",
    from: "נתניה",
    to: "ירושלים",
    cargo: "ציוד בנייה",
    date: "17/08",
    status: "in_progress",
  },
  {
    id: "HS-1044",
    sender: "שרון בר",
    phone: "972523334455",
    from: "מודיעין",
    to: "אילת",
    cargo: "6 משטחים",
    date: "16/08",
    status: "done",
  },
  {
    id: "HS-1045",
    sender: "יוסי אדרי",
    phone: "972508887766",
    from: "חדרה",
    to: "טבריה",
    cargo: "מנוף + מטען חריג",
    date: "18/08",
    status: "pending",
  },
];

export const CONTACTS: Record<string, string> = Object.fromEntries(
  ORDERS.map((o) => [o.phone, o.sender]),
);

export function buildMorningReport(orders: Order[]) {
  const pending = orders.filter((o) => o.status === "pending");
  let report = "📅 *דוח בוקר - ח. סבן*\n\n";
  for (const o of pending) {
    report += `📦 הזמנה מ-${o.sender}\n🛣️ ${o.from} ← ${o.to} | ${o.cargo}\n\n`;
  }
  report += `סה"כ הזמנות ממתינות: *${pending.length}*\n🕕 נשלח אוטומטית ב-06:30`;
  return report;
}

export const TEMPLATES: { name: string; emoji: string; body: string }[] = [
  {
    name: "אישור הזמנה",
    emoji: "✅",
    body: "✅ *ההזמנה אושרה!*\n\n📦 מטען: {מטען}\n🛣️ מסלול: {מוצא} ← {יעד}\n🕒 שעת איסוף: {שעה}\n\nתודה שבחרתם ב_ח. סבן הובלות_ 🚚",
  },
  {
    name: "בדרך אליך",
    emoji: "🚚",
    body: "🚚 *הנהג בדרך אליך*\n\n👤 נהג: {נהג}\n📞 טלפון: {טלפון}\n⏱️ הגעה משוערת: {דקות} דקות",
  },
  {
    name: "הצעת מחיר",
    emoji: "🧾",
    body: "🧾 *הצעת מחיר - ח. סבן*\n\n🛣️ {מוצא} ← {יעד}\n📦 {מטען}\n💰 מחיר: *{מחיר} ₪* (לא כולל מע״מ)\n\nההצעה בתוקף ל-48 שעות ⏳",
  },
  {
    name: "דוח בוקר",
    emoji: "📅",
    body: "📅 *דוח בוקר - ח. סבן*\n\n📦 הזמנות ממתינות: *{מספר}*\n🚚 משאיות בדרך: {משאיות}\n\nיום עבודה מוצלח! ☀️",
  },
];

export const EMOJI_KIT = [
  "🧰",
  "🚚",
  "📦",
  "📅",
  "✅",
  "🕒",
  "📞",
  "💰",
  "🛣️",
  "⚠️",
  "🔥",
  "👍",
  "🙏",
  "☀️",
  "🏗️",
  "🧾",
];

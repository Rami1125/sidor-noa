/**
 * 🧠 noaBrain.js — המוח של נועה
 * ------------------------------------------------------
 * אחראי על:
 *  1. 💬 מענה אוטומטי מול לקוחות (זיהוי כוונה + תשובה בעברית)
 *  2. 📦 נרמול הזמנות מטקסט חופשי לאובייקט מסודר
 *  3. 📅 בניית דו"ח בוקר מעוצב לוואטסאפ
 *
 * ללא תלויות חיצוניות — JS טהור.
 */

/* ========== עזרי טקסט ========== */

const HE_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

function clean(text = '') {
  return String(text)
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/[٠-٩]/g, (d) => HE_DIGITS[d] || d)
    .replace(/\s+/g, ' ')
    .trim();
}

/** נרמול מספר טלפון ישראלי ל־E.164 (972…) */
function normalizePhone(raw = '') {
  let d = clean(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('972')) return '+' + d;
  if (d.startsWith('0')) return '+972' + d.slice(1);
  if (d.length === 9) return '+972' + d;
  return '+' + d;
}

/** מזהה צ'אט של whatsapp-web.js מתוך טלפון */
function toChatId(phone) {
  const p = normalizePhone(phone);
  return p ? p.replace('+', '') + '@c.us' : null;
}

/* ========== 1. נרמול הזמנה ========== */

const UNIT_MAP = [
  { re: /\b(ק"?ג|קילו|kg)\b/i, unit: 'ק"ג' },
  { re: /\b(טון|ton)\b/i, unit: 'טון' },
  { re: /\b(מ"?ק|קוב|מטר מעוקב)\b/i, unit: 'מ"ק' },
  { re: /\b(יח'?|יחידות|unit)\b/i, unit: "יח'" },
  { re: /\b(שק|שקים)\b/i, unit: 'שקים' },
  { re: /\b(משטח|משטחים)\b/i, unit: 'משטחים' },
];

const PRODUCTS = [
  'חול', 'חצץ', 'בטון', 'מלט', 'סומסום', 'טיט', 'אבן', 'עפר', 'מצע',
  'בלוקים', 'ברזל', 'לוחות', 'אספלט', 'כורכר', 'טוף',
];

const URGENT_WORDS = ['דחוף', 'היום', 'עכשיו', 'מיידי', 'בהול'];

function parseDate(text) {
  const t = clean(text);
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  if (/\bהיום\b/.test(t)) return iso(today);
  if (/\bמחר\b/.test(t)) return iso(new Date(today.getTime() + 864e5));
  if (/\bמחרתיים\b/.test(t)) return iso(new Date(today.getTime() + 2 * 864e5));
  const m = t.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (m) {
    const day = +m[1], mon = +m[2];
    let year = m[3] ? +m[3] : today.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, mon - 1, day));
    if (!isNaN(d.getTime())) return iso(d);
  }
  return null;
}

function parseTime(text) {
  const m = clean(text).match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  return m ? `${String(m[1]).padStart(2, '0')}:${m[2]}` : null;
}

/**
 * 📦 normalizeOrder — טקסט חופשי → הזמנה מסודרת
 * @param {string} text  תוכן ההודעה
 * @param {object} meta  { sender, phone, chatId, receivedAt }
 */
function normalizeOrder(text, meta = {}) {
  const raw = clean(text);
  const lower = raw.toLowerCase();

  // כמות + יחידה
  let quantity = null;
  let unit = null;
  const qm = raw.match(/(\d+(?:[.,]\d+)?)\s*(ק"?ג|קילו|kg|טון|ton|מ"?ק|קוב|יח'?|יחידות|שקים?|משטחים?)?/i);
  if (qm) {
    quantity = parseFloat(qm[1].replace(',', '.'));
    if (qm[2]) {
      const hit = UNIT_MAP.find((u) => u.re.test(qm[2]));
      unit = hit ? hit.unit : qm[2];
    }
  }
  if (!unit) {
    const hit = UNIT_MAP.find((u) => u.re.test(raw));
    if (hit) unit = hit.unit;
  }

  const product = PRODUCTS.find((p) => raw.includes(p)) || null;

  // כתובת / אתר
  let address = null;
  const am = raw.match(/(?:ל|אל|כתובת|אתר|ברחוב|רחוב)\s*[:\-]?\s*([\u0590-\u05FF\w'"\- ]{3,40})/);
  if (am) address = am[1].trim();

  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    status: 'pending',
    product,
    quantity,
    unit,
    address,
    date: parseDate(raw),
    time: parseTime(raw),
    urgent: URGENT_WORDS.some((w) => lower.includes(w)),
    sender: meta.sender || 'לקוח',
    phone: normalizePhone(meta.phone || ''),
    chatId: meta.chatId || toChatId(meta.phone || ''),
    rawText: raw,
    receivedAt: meta.receivedAt || new Date().toISOString(),
  };

  order.missing = ['product', 'quantity', 'address', 'date'].filter((k) => !order[k]);
  order.confidence = Math.max(0, 1 - order.missing.length * 0.25);
  return order;
}

/** האם ההודעה נראית כמו הזמנה? */
function looksLikeOrder(text) {
  const t = clean(text);
  const hasProduct = PRODUCTS.some((p) => t.includes(p));
  const hasQty = /\d/.test(t);
  const hasVerb = /(צריך|רוצה|תביא|תשלח|להזמין|הזמנה|משלוח|תעמיס)/.test(t);
  return (hasProduct && hasQty) || (hasVerb && hasQty);
}

/* ========== 2. מענה ללקוחות ========== */

const INTENTS = [
  {
    id: 'greeting',
    re: /^(היי|שלום|בוקר טוב|ערב טוב|הי|מה נשמע|אהלן)/,
    reply: () => 'שלום 👋 הגעתם ל*ח. סבן* 🚛\nאיך אפשר לעזור? אפשר לשלוח הזמנה בהודעה אחת, לדוגמה:\n_"20 טון חצץ למגרש ברחוב הרצל מחר ב-08:00"_',
  },
  {
    id: 'hours',
    re: /(שעות|פתוח|סגור|מתי אתם)/,
    reply: () => '🕗 *שעות פעילות*\nא׳-ה׳: 06:00–17:00\nו׳: 06:00–12:00\nשבת: סגור',
  },
  {
    id: 'price',
    re: /(מחיר|כמה עולה|הצעת מחיר|תמחור)/,
    reply: () => '💰 המחיר נקבע לפי סוג החומר, כמות ומרחק ההובלה.\nשלחו לי *מה צריך + כמות + כתובת* ואחזור עם הצעה מדויקת ⏱️',
  },
  {
    id: 'status',
    re: /(סטטוס|איפה ההזמנה|מתי מגיע|הנהג)/,
    reply: () => '🔎 בודקת את סטטוס ההזמנה שלכם...\nאעדכן כאן תוך מספר דקות עם זמן הגעה משוער 🚚',
  },
  {
    id: 'cancel',
    re: /(לבטל|ביטול)/,
    reply: () => '⚠️ קיבלתי בקשת *ביטול*.\nכדי לאשר, כתבו את מספר ההזמנה או את שעת האספקה שנקבעה.',
  },
  {
    id: 'thanks',
    re: /(תודה|מעולה|סבבה|יופי)/,
    reply: () => 'בשמחה 🙏 תמיד כאן בשבילכם — *ח. סבן* 🚛',
  },
];

/** תשובה להזמנה שהתקבלה */
function orderReply(order) {
  const lines = ['✅ *ההזמנה התקבלה!* 📦', ''];
  lines.push(`🆔 מספר הזמנה: *${order.id}*`);
  if (order.product) lines.push(`🧱 חומר: *${order.product}*`);
  if (order.quantity) lines.push(`⚖️ כמות: *${order.quantity}${order.unit ? ' ' + order.unit : ''}*`);
  if (order.address) lines.push(`📍 יעד: *${order.address}*`);
  if (order.date) lines.push(`📅 תאריך: *${order.date}*${order.time ? ` בשעה *${order.time}*` : ''}`);
  if (order.urgent) lines.push('🔴 סומן כ*דחוף*');
  if (order.missing.length) {
    const labels = { product: 'סוג החומר 🧱', quantity: 'כמות ⚖️', address: 'כתובת 📍', date: 'תאריך 📅' };
    lines.push('', '❓ חסר לי עוד קצת מידע:');
    order.missing.forEach((k) => lines.push(`• ${labels[k]}`));
  }
  lines.push('', '_נחזור אליכם עם אישור סופי בהקדם_ 🙏');
  return lines.join('\n');
}

/**
 * 💬 respond — המענה הראשי
 * @returns {{ reply: string|null, order: object|null, intent: string }}
 */
function respond(text, meta = {}) {
  const t = clean(text);
  if (!t) return { reply: null, order: null, intent: 'empty' };

  if (looksLikeOrder(t)) {
    const order = normalizeOrder(t, meta);
    return { reply: orderReply(order), order, intent: 'order' };
  }

  const hit = INTENTS.find((i) => i.re.test(t));
  if (hit) return { reply: hit.reply(), order: null, intent: hit.id };

  return {
    reply: '🤖 לא בטוחה שהבנתי במדויק.\nאפשר לכתוב לי:\n1️⃣ *הזמנה* (חומר + כמות + כתובת + תאריך)\n2️⃣ *מחיר*\n3️⃣ *סטטוס*\nואשמח לעזור 🧰',
    order: null,
    intent: 'fallback',
  };
}

/* ========== 3. דו"ח בוקר ========== */

const STATUS_LABEL = {
  pending: '🟡 ממתין',
  approved: '🟢 מאושר',
  delivering: '🚚 בדרך',
  done: '✅ הושלם',
  canceled: '❌ בוטל',
};

/**
 * 📅 buildMorningReport — דו"ח בוקר מעוצב לוואטסאפ
 * @param {Array} orders רשימת הזמנות מנורמלות
 */
function buildMorningReport(orders = [], now = new Date()) {
  const date = now.toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const pending = orders.filter((o) => o.status === 'pending');
  const urgent = orders.filter((o) => o.urgent && o.status !== 'done' && o.status !== 'canceled');

  const lines = [];
  lines.push('📅 *דוח בוקר — ח. סבן* 🚛');
  lines.push(`_${date} • 06:30_`);
  lines.push('━━━━━━━━━━━━━━━');

  if (!orders.length) {
    lines.push('', '🎉 אין הזמנות פתוחות. בוקר רגוע!');
    return lines.join('\n');
  }

  lines.push('', `📦 *הזמנות ממתינות: ${pending.length}*`, '');
  pending.slice(0, 20).forEach((o, i) => {
    lines.push(`${i + 1}. ${o.urgent ? '🔴' : '🔹'} *${o.sender}*`);
    const detail = [o.product, o.quantity ? `${o.quantity}${o.unit ? ' ' + o.unit : ''}` : null].filter(Boolean).join(' • ');
    if (detail) lines.push(`   🧱 ${detail}`);
    if (o.address) lines.push(`   📍 ${o.address}`);
    if (o.date) lines.push(`   📅 ${o.date}${o.time ? ` ⏰ ${o.time}` : ''}`);
    lines.push(`   ${STATUS_LABEL[o.status] || o.status}`);
  });

  if (urgent.length) {
    lines.push('', `🚨 *דחופים להיום: ${urgent.length}*`);
    urgent.forEach((o) => lines.push(`• ${o.sender} — ${o.product || 'ללא פירוט'}`));
  }

  lines.push('', '━━━━━━━━━━━━━━━');
  lines.push(`📊 סה"כ הזמנות במערכת: *${orders.length}*`);
  lines.push('🧰 _נשלח אוטומטית ע"י נועה_ 🤖');
  return lines.join('\n');
}

module.exports = {
  clean,
  normalizePhone,
  toChatId,
  normalizeOrder,
  looksLikeOrder,
  respond,
  orderReply,
  buildMorningReport,
  STATUS_LABEL,
};

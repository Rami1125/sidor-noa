/**
 * 🚛 שרת מקומי — חיבור וואטסאפ דרך QR
 * ------------------------------------------------------
 * מריץ whatsapp-web.js, מציג QR בטרמינל ובדפדפן,
 * מקבל הודעות בזמן אמת, מפעיל את noaBrain למענה ונרמול,
 * מסנכרן לאפליקציה (CRM) ושולח דו"ח בוקר ב-06:30.
 *
 * הפעלה:
 *   cd local-server && npm install && npm start
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const brain = require('./noaBrain');

/* ========== ⚙️ הגדרות ========== */
const PORT = process.env.PORT || 8787;
// כתובת האפליקציה (Preview/Published) לסנכרון הודעות למסך
const APP_URL = process.env.APP_URL || 'http://localhost:8080';
// קבוצת/מספר יעד לדו"ח הבוקר, למשל '972501234567@c.us' או מזהה קבוצה
const REPORT_TARGET = process.env.REPORT_TARGET || '';
const AUTO_REPLY = process.env.AUTO_REPLY !== 'false';
const DB_FILE = path.join(__dirname, 'orders.json');

/* ========== 🗃️ אחסון הזמנות ========== */
function loadOrders() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { return []; }
}
function saveOrders(list) {
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
}
let orders = loadOrders();

/* ========== 🔌 סנכרון לאפליקציה ========== */
async function pushToApp(chatId, text, from = 'them', author = 'לקוח') {
  try {
    await fetch(`${APP_URL}/api/public/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: String(chatId).slice(0, 30), text, from, author }),
    });
  } catch (e) {
    console.warn('⚠️  סנכרון לאפליקציה נכשל:', e.message);
  }
}

/* ========== 📱 לקוח וואטסאפ ========== */
let lastQr = null;
let status = 'starting'; // starting | qr | authenticated | ready | disconnected

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

client.on('qr', (qr) => {
  lastQr = qr;
  status = 'qr';
  console.log('\n🔗 סרקו את הקוד מהוואטסאפ בנייד (מכשירים מקושרים):\n');
  qrcodeTerminal.generate(qr, { small: true });
  console.log(`\n🌐 או פתחו בדפדפן: http://localhost:${PORT}/qr\n`);
});

client.on('authenticated', () => { status = 'authenticated'; console.log('🔐 אומת בהצלחה'); });
client.on('ready', () => { status = 'ready'; lastQr = null; console.log('✅ נועה מחוברת לוואטסאפ ומאזינה להודעות'); });
client.on('disconnected', (r) => { status = 'disconnected'; console.log('🔌 נותק:', r); });

client.on('message', async (msg) => {
  if (msg.from === 'status@broadcast') return;
  const contact = await msg.getContact().catch(() => null);
  const meta = {
    sender: (contact && (contact.pushname || contact.name)) || msg.from.split('@')[0],
    phone: msg.from.split('@')[0],
    chatId: msg.from,
  };

  console.log(`💬 ${meta.sender}: ${msg.body}`);
  await pushToApp(meta.phone, msg.body, 'them', meta.sender);

  const { reply, order, intent } = brain.respond(msg.body, meta);

  if (order) {
    orders.push(order);
    saveOrders(orders);
    console.log(`📦 הזמנה חדשה נקלטה: ${order.id} (ביטחון ${Math.round(order.confidence * 100)}%)`);
  }

  if (AUTO_REPLY && reply) {
    await msg.reply(reply);
    await pushToApp(meta.phone, reply, 'me', 'נועה 🤖');
    console.log(`🤖 נשלח מענה (${intent})`);
  }
});

/* ========== 📅 דו"ח בוקר 06:30 ========== */
async function sendMorningReport(target) {
  const to = target || REPORT_TARGET;
  const report = brain.buildMorningReport(orders);
  if (to && status === 'ready') {
    await client.sendMessage(to, report);
    await pushToApp(String(to).split('@')[0], report, 'me', 'נועה 🤖');
  }
  console.log('📅 דוח בוקר נשלח\n' + report);
  return report;
}

cron.schedule('30 6 * * *', () => sendMorningReport().catch(console.error), {
  timezone: 'Asia/Jerusalem',
});

/* ========== 🌐 API מקומי ========== */
const app = express();
app.use(cors());
app.use(express.json());

app.get('/status', (_req, res) => res.json({ status, orders: orders.length, hasQr: !!lastQr }));

app.get('/qr', async (_req, res) => {
  if (!lastQr) return res.send(`<h2 dir="rtl">מצב: ${status} — אין QR פעיל 🔄</h2>`);
  const img = await QRCode.toDataURL(lastQr, { width: 320 });
  res.send(`<html dir="rtl"><body style="font-family:system-ui;text-align:center;padding:32px">
    <h2>📱 סריקת QR — חיבור וואטסאפ</h2><img src="${img}"/>
    <p>וואטסאפ ← הגדרות ← מכשירים מקושרים ← קישור מכשיר</p>
    <script>setTimeout(()=>location.reload(),20000)</script></body></html>`);
});

app.get('/orders', (_req, res) => res.json({ orders }));

app.post('/send', async (req, res) => {
  const { phone, text } = req.body || {};
  const chatId = brain.toChatId(phone);
  if (!chatId || !text) return res.status(400).json({ error: 'phone + text נדרשים' });
  if (status !== 'ready') return res.status(503).json({ error: 'וואטסאפ עדיין לא מחובר' });
  await client.sendMessage(chatId, text);
  await pushToApp(String(phone), text, 'me', 'ח. סבן');
  res.json({ ok: true });
});

app.post('/report', async (req, res) => {
  const report = await sendMorningReport(req.body && req.body.target);
  res.json({ ok: true, report });
});

app.listen(PORT, () => console.log(`🌐 שרת מקומי פועל: http://localhost:${PORT}`));

client.initialize();

export type ChatMessage = {
  id: string;
  chatId: string;
  from: "me" | "them";
  author: string;
  text: string;
  ts: number;
};

type Store = { messages: ChatMessage[] };

const g = globalThis as unknown as { __hsMessages?: Store };

function seed(): ChatMessage[] {
  const now = Date.now();
  return [
    {
      id: "s1",
      chatId: "972501234567",
      from: "them",
      author: "משה לוי",
      text: "בוקר טוב, יש לכם משאית פנויה למחר?",
      ts: now - 1000 * 60 * 42,
    },
    {
      id: "s2",
      chatId: "972501234567",
      from: "me",
      author: "ח. סבן",
      text: "*בוקר טוב* 🌞\nכן, יש לנו זמינות למחר ב-08:00.",
      ts: now - 1000 * 60 * 38,
    },
    {
      id: "s3",
      chatId: "972529876543",
      from: "them",
      author: "דנה כהן",
      text: "צריכה הובלה מאשדוד לחיפה 🚚",
      ts: now - 1000 * 60 * 12,
    },
  ];
}

export function getStore(): Store {
  if (!g.__hsMessages) g.__hsMessages = { messages: seed() };
  return g.__hsMessages;
}

export function listMessages(since: number): ChatMessage[] {
  return getStore().messages.filter((m) => m.ts > since);
}

export function addMessage(msg: Omit<ChatMessage, "id" | "ts">): ChatMessage {
  const full: ChatMessage = {
    ...msg,
    id: Math.random().toString(36).slice(2),
    ts: Date.now(),
  };
  const store = getStore();
  store.messages.push(full);
  if (store.messages.length > 500) store.messages.splice(0, store.messages.length - 500);
  return full;
}

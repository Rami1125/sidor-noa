import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const sendSchema = z.object({
  chatId: z.string().min(3).max(30),
  text: z.string().min(1).max(4000),
  author: z.string().min(1).max(60).optional(),
  from: z.enum(["me", "them"]).optional(),
});

export const Route = createFileRoute("/api/public/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { listMessages } = await import("@/lib/message-store.server");
        const url = new URL(request.url);
        const since = Number(url.searchParams.get("since") ?? 0) || 0;
        return Response.json({ messages: listMessages(since), now: Date.now() });
      },
      POST: async ({ request }) => {
        const { addMessage } = await import("@/lib/message-store.server");
        const parsed = sendSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }
        const { chatId, text, author, from } = parsed.data;
        const message = addMessage({
          chatId,
          text,
          from: from ?? "me",
          author: author ?? (from === "them" ? "לקוח" : "ח. סבן"),
        });
        return Response.json({ ok: true, message });
      },
    },
  },
});

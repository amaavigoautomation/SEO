export const dynamic = "force-dynamic";
export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generate, type ChatMessage } from "@/lib/openai";
import { buildSystem } from "@/lib/prompt";

const HISTORY_LIMIT = 20; // last N messages are sent along with the brand context

// POST /api/chats/:id/messages { message } -> appends the user message and the AI reply
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const chat = await prisma.conversation.findUnique({ where: { id }, include: { brand: true } });
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const recent = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  const history: ChatMessage[] = recent
    .reverse()
    .map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }));

  try {
    const { text, model } = await generate([
      buildSystem(chat.brand.name, chat.brand.context),
      ...history,
      { role: "user", content: message },
    ]);
    const now = Date.now();
    const user = await prisma.message.create({
      data: { conversationId: id, role: "user", content: message, createdBy: session.name, createdAt: new Date(now) },
    });
    const assistant = await prisma.message.create({
      data: { conversationId: id, role: "assistant", content: text, model, createdAt: new Date(now + 1) },
    });
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    return NextResponse.json({
      user: { id: user.id, role: "user", content: user.content, createdBy: user.createdBy, model: null, images: [] },
      assistant: { id: assistant.id, role: "assistant", content: assistant.content, createdBy: null, model, images: [] },
    });
  } catch (e) {
    // The user's message is not saved on failure; the client keeps the text so they can retry.
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

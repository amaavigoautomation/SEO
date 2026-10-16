export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { applyAction } from "@/lib/status";

// POST /api/chats/:id/status { action, comment? }
// actions: send_for_review | approve | request_changes | ready_to_publish | reopen
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const comment = String(body.comment ?? "").trim().slice(0, 2000);

  const chat = await prisma.conversation.findUnique({ where: { id } });
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const result = applyAction(chat.status, action, comment);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });

  if (action === "send_for_review") {
    const replies = await prisma.message.count({ where: { conversationId: id, role: "assistant" } });
    if (replies === 0) return NextResponse.json({ error: "There is no draft to review yet" }, { status: 409 });
  }

  await prisma.conversation.update({
    where: { id },
    data: {
      status: result.to,
      updatedAt: new Date(),
      events: {
        create: {
          action,
          actor: session.name,
          fromStatus: chat.status,
          toStatus: result.to,
          comment: comment || null,
        },
      },
    },
  });
  return NextResponse.json({ ok: true, status: result.to });
}

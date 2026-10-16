export const dynamic = "force-dynamic";
export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generate } from "@/lib/openai";
import { buildSystem } from "@/lib/prompt";

// POST /api/chats { brandId, message } -> starts a chat and returns the first reply
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const brandId = String(body.brandId ?? "");
  const message = String(body.message ?? "").trim();
  if (!brandId || !message) return NextResponse.json({ error: "brandId and message are required" }, { status: 400 });

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) return NextResponse.json({ error: "Unknown brand" }, { status: 404 });

  try {
    const { text, model } = await generate([buildSystem(brand.name, brand.context), { role: "user", content: message }]);
    const now = Date.now();
    const chat = await prisma.conversation.create({
      data: {
        brandId,
        title: message.replace(/\s+/g, " ").slice(0, 80),
        createdBy: session.name,
        messages: {
          create: [
            { role: "user", content: message, createdBy: session.name, createdAt: new Date(now) },
            { role: "assistant", content: text, model, createdAt: new Date(now + 1) },
          ],
        },
      },
    });
    return NextResponse.json({ chatId: chat.id }, { status: 201 });
  } catch (e) {
    // Nothing is saved on failure, so a failed run can never look like finished work.
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateImage } from "@/lib/openai";
import { splitContent } from "@/lib/segments";

// POST /api/messages/:id/images { slot } -> (re)generates the image for that slot
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const slot = Number(body.slot);

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.role !== "assistant") return NextResponse.json({ error: "Message not found" }, { status: 404 });

  // prompt and alt come from the stored message, never from the client
  const seg = splitContent(message.content).find((s) => s.type === "image" && s.slot === slot);
  if (!seg || seg.type !== "image") return NextResponse.json({ error: "Image slot not found" }, { status: 404 });

  try {
    const { data, mime } = await generateImage(seg.prompt);
    await prisma.image.deleteMany({ where: { messageId: id, slot } });
    const img = await prisma.image.create({ data: { messageId: id, slot, prompt: seg.prompt, alt: seg.alt, mime, data: new Uint8Array(data) } });    
    return NextResponse.json({ id: img.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

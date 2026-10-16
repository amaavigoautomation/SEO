export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await prisma.image.findUnique({ where: { id } });
  if (!img) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": img.mime,
    "Cache-Control": "private, max-age=3600",
  };
  if (req.nextUrl.searchParams.get("download")) {
    headers["Content-Disposition"] = `attachment; filename="image-${img.slot + 1}.png"`;
  }
  return new NextResponse(new Uint8Array(img.data), { headers });
}

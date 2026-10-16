export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const context = String(body.context ?? "").trim();
  if (!name || !context) return NextResponse.json({ error: "Name and context are required" }, { status: 400 });

  const clash = await prisma.brand.findFirst({ where: { name, NOT: { id } } });
  if (clash) return NextResponse.json({ error: "Another brand already uses this name" }, { status: 409 });

  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const brand = await prisma.brand.update({ where: { id }, data: { name, context } });
  return NextResponse.json({ brand });
}

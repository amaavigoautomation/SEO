export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const context = String(body.context ?? "").trim();
  if (!name || !context) return NextResponse.json({ error: "Name and context are required" }, { status: 400 });

  const exists = await prisma.brand.findUnique({ where: { name } });
  if (exists) return NextResponse.json({ error: "A brand with this name already exists" }, { status: 409 });

  const brand = await prisma.brand.create({ data: { name, context } });
  return NextResponse.json({ brand }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { COOKIE, MAX_AGE_SECONDS, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return NextResponse.json({ error: "APP_PASSWORD is not set on the server" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  if (typeof body.password !== "string" || body.password !== expected) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSession(name), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}

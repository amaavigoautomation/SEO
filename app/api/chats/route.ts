export const dynamic = "force-dynamic";
export const maxDuration = 300;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generate } from "@/lib/openai";
import { buildSystem } from "@/lib/prompt";
import { getWorkflow } from "@/lib/workflows";

// POST /api/chats { brandId, workflow, values } -> starts a chat from a workflow and returns the first reply
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const brandId = String(body.brandId ?? "");
  const workflow = getWorkflow(String(body.workflow ?? "free"));
  if (!brandId || !workflow) return NextResponse.json({ error: "brandId and a valid workflow are required" }, { status: 400 });

  // keep only known string fields, trimmed and length-limited
  const raw = (body.values ?? {}) as Record<string, unknown>;
  const values: Record<string, string> = {};
  for (const f of workflow.fields) {
    values[f.name] = typeof raw[f.name] === "string" ? (raw[f.name] as string).trim().slice(0, 5000) : "";
  }
  const missing = workflow.fields.find((f) => f.required && !values[f.name]);
  if (missing) return NextResponse.json({ error: `${missing.label} is required` }, { status: 400 });

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) return NextResponse.json({ error: "Unknown brand" }, { status: 404 });

  const message = workflow.buildMessage(values);
  try {
    const { text, model } = await generate([
      buildSystem(brand.name, brand.context, workflow),
      { role: "user", content: message },
    ]);
    const now = Date.now();
    const chat = await prisma.conversation.create({
      data: {
        brandId,
        workflow: workflow.key,
        status: "draft",
        title: workflow.title(values).replace(/\s+/g, " ").slice(0, 80),
        createdBy: session.name,
        messages: {
          create: [
            { role: "user", content: message, createdBy: session.name, createdAt: new Date(now) },
            { role: "assistant", content: text, model, createdAt: new Date(now + 1) },
          ],
        },
        events: { create: { action: "created", actor: session.name, toStatus: "draft", comment: workflow.label } },
      },
    });
    return NextResponse.json({ chatId: chat.id }, { status: 201 });
  } catch (e) {
    // Nothing is saved on failure, so a failed run can never look like finished work.
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

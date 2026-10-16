export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatView, { type Msg } from "@/components/ChatView";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await prisma.conversation.findUnique({
    where: { id },
    include: {
      brand: true,
      messages: { orderBy: { createdAt: "asc" }, include: { images: { select: { id: true, slot: true } } } },
    },
  });
  if (!chat) notFound();

  const initial: Msg[] = chat.messages.map(
    (m: { id: string; role: string; content: string; model: string | null; createdBy: string | null; images: { id: string; slot: number }[] }) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      model: m.model,
      createdBy: m.createdBy,
      images: m.images,
    }),
  );

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}><Link href="/">Chats</Link> / {chat.brand.name}</p>
      <h1>{chat.title}</h1>
      <ChatView chatId={chat.id} initial={initial} />
    </>
  );
}

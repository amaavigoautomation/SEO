export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/format";

export default async function Home({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand: brandId } = await searchParams;
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  const chats = await prisma.conversation.findMany({
    where: brandId ? { brandId } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { brand: true, _count: { select: { messages: true } } },
  });

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <h1 style={{ margin: 0 }}>Chats</h1>
        <Link className="btn primary" href={brandId ? `/chat/new?brand=${brandId}` : "/chat/new"}>New chat</Link>
      </div>

      <div className="chips" style={{ marginTop: 16 }}>
        <Link className="pill" href="/" style={{ fontWeight: brandId ? 400 : 700 }}>All brands</Link>
        {brands.map((b: { id: string; name: string }) => (
          <Link key={b.id} className="pill" href={`/?brand=${b.id}`} style={{ fontWeight: brandId === b.id ? 700 : 400 }}>
            {b.name}
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>Brand</th><th>Chat</th><th>Messages</th><th>Started by</th><th>Last active (IST)</th></tr>
          </thead>
          <tbody>
            {chats.map((c: { id: string; title: string; createdBy: string; updatedAt: Date; brand: { name: string }; _count: { messages: number } }) => (
              <tr key={c.id}>
                <td>{c.brand.name}</td>
                <td><Link href={`/chat/${c.id}`}>{c.title}</Link></td>
                <td>{c._count.messages}</td>
                <td>{c.createdBy}</td>
                <td>{fmt(c.updatedAt)}</td>
              </tr>
            ))}
            {chats.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{ padding: 20 }}>No chats yet. Start with “New chat”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

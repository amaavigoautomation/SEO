export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/format";
import { STATUSES, STATUS_LABEL } from "@/lib/status";
import { WORKFLOWS, WORKFLOW_LABEL } from "@/lib/workflows";

type Row = {
  id: string; title: string; createdBy: string; updatedAt: Date; status: string; workflow: string; brandId: string;
  brand: { name: string }; _count: { messages: number };
};

export default async function Home({ searchParams }: { searchParams: Promise<{ brand?: string; status?: string; workflow?: string }> }) {
  const { brand: brandId, status, workflow } = await searchParams;
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  const all: Row[] = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: { brand: true, _count: { select: { messages: true } } },
  });

  // progress counts follow the brand filter only, so they stay clickable as status filters
  const inBrand = brandId ? all.filter((c) => c.brandId === brandId) : all;
  const counts: Record<string, number> = {};
  for (const c of inBrand) counts[c.status] = (counts[c.status] ?? 0) + 1;
  const chats = inBrand.filter((c) => (!status || c.status === status) && (!workflow || c.workflow === workflow)).slice(0, 100);

  const href = (o: { brand?: string; status?: string; workflow?: string }) => {
    const q = new URLSearchParams();
    const b = "brand" in o ? o.brand : brandId;
    const s = "status" in o ? o.status : status;
    const w = "workflow" in o ? o.workflow : workflow;
    if (b) q.set("brand", b);
    if (s) q.set("status", s);
    if (w) q.set("workflow", w);
    const str = q.toString();
    return str ? `/?${str}` : "/";
  };
  const bold = (on: boolean) => ({ fontWeight: on ? 700 : 400 });

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <h1 style={{ margin: 0 }}>Chats</h1>
        <Link className="btn primary" href={brandId ? `/chat/new?brand=${brandId}` : "/chat/new"}>New chat</Link>
      </div>

      <div className="chips" style={{ marginTop: 16 }}>
        <Link className="pill" href={href({ brand: undefined })} style={bold(!brandId)}>All brands</Link>
        {brands.map((b: { id: string; name: string }) => (
          <Link key={b.id} className="pill" href={href({ brand: b.id })} style={bold(brandId === b.id)}>{b.name}</Link>
        ))}
      </div>

      <div className="chips">
        <Link className="pill" href={href({ status: undefined })} style={bold(!status)}>All ({inBrand.length})</Link>
        {STATUSES.map((s) => (
          <Link key={s} className={`pill ${s}`} href={href({ status: s })} style={bold(status === s)}>
            {STATUS_LABEL[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="chips">
        <Link className="pill" href={href({ workflow: undefined })} style={bold(!workflow)}>Any type</Link>
        {WORKFLOWS.map((w) => (
          <Link key={w.key} className="pill" href={href({ workflow: w.key })} style={bold(workflow === w.key)}>{w.label}</Link>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>Brand</th><th>Chat</th><th>Type</th><th>Status</th><th>Started by</th><th>Last active (IST)</th></tr>
          </thead>
          <tbody>
            {chats.map((c) => (
              <tr key={c.id}>
                <td>{c.brand.name}</td>
                <td><Link href={`/chat/${c.id}`}>{c.title}</Link></td>
                <td>{WORKFLOW_LABEL[c.workflow] ?? "Free chat"}</td>
                <td><span className={`pill ${c.status}`}>{STATUS_LABEL[c.status] ?? c.status}</span></td>
                <td>{c.createdBy}</td>
                <td>{fmt(c.updatedAt)}</td>
              </tr>
            ))}
            {chats.length === 0 && (
              <tr><td colSpan={6} className="muted" style={{ padding: 20 }}>No chats match. Start with “New chat”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

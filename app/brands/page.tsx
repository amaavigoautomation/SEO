export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/format";

export default async function Brands() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { conversations: true } } } });
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <h1 style={{ margin: 0 }}>Brands</h1>
        <Link className="btn primary" href="/brands/new">Add brand</Link>
      </div>
      <div className="card" style={{ padding: 0, marginTop: 16 }}>
        <table>
          <thead><tr><th>Brand</th><th>Context size</th><th>Chats</th><th>Updated</th></tr></thead>
          <tbody>
            {brands.map((b: { id: string; name: string; context: string; updatedAt: Date; _count: { conversations: number } }) => (
              <tr key={b.id}>
                <td><Link href={`/brands/${b.id}`}>{b.name}</Link></td>
                <td>{b.context.length.toLocaleString()} chars</td>
                <td>{b._count.conversations}</td>
                <td>{fmt(b.updatedAt)}</td>
              </tr>
            ))}
            {brands.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 20 }}>No brands yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewChatForm from "@/components/NewChatForm";

export default async function NewChat({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams;
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <h1>New chat</h1>
      {brands.length === 0 ? (
        <p>Add a brand first: <Link href="/brands/new">Add brand</Link></p>
      ) : (
        <NewChatForm brands={brands} initialBrandId={brands.find((b: { id: string }) => b.id === brand)?.id ?? brands[0].id} />
      )}
    </>
  );
}

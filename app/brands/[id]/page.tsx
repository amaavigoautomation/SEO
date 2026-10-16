export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BrandForm from "@/components/BrandForm";

export default async function EditBrand({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) notFound();
  return (
    <>
      <h1>{brand.name}</h1>
      <BrandForm brand={{ id: brand.id, name: brand.name, context: brand.context }} />
    </>
  );
}

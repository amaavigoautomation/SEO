import { PrismaClient } from "@prisma/client";
import brands from "./brands.json";

const prisma = new PrismaClient();
const reset = process.argv.includes("--reset");

async function main() {
  for (const b of brands) {
    // Default: only create missing brands so edits made in the app are never overwritten.
    // With --reset: overwrite context of these brands with the file's version.
    await prisma.brand.upsert({ where: { name: b.name }, update: reset ? { context: b.context } : {}, create: b });
  }
  console.log(reset ? "Reset context for:" : "Seeded (missing only):", brands.map((b) => b.name).join(", "));
}

main().finally(() => prisma.$disconnect());

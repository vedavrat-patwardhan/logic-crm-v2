import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Records with a business date strictly before 24 June 2026 (local IST midnight).
// 2026-06-24 00:00 IST == 2026-06-23T18:30:00.000Z
const CUTOFF = new Date("2026-06-23T18:30:00.000Z");
const DRY_RUN = process.argv.includes("--dry");

async function main() {
  const where = {
    date: { lt: CUTOFF },
    NOT: { status: "DELIVERED" as const },
  };

  const total = await prisma.jobCard.count({ where: { date: { lt: CUTOFF } } });
  const toUpdate = await prisma.jobCard.count({ where });
  console.log(`Job cards dated before 2026-06-24: ${total}`);
  console.log(`Not yet completed (will change): ${toUpdate}`);

  if (DRY_RUN) {
    const sample = await prisma.jobCard.findMany({
      where,
      take: 5,
      orderBy: { date: "desc" },
      select: { jobNo: true, date: true, status: true },
    });
    console.log("Sample of records that would change:");
    console.table(
      sample.map((s) => ({
        jobNo: s.jobNo,
        date: s.date.toISOString().slice(0, 10),
        status: s.status,
      })),
    );
    return;
  }

  const res = await prisma.jobCard.updateMany({
    where,
    data: { status: "DELIVERED", done: true, currentStatus: "DELIVERED" },
  });
  console.log(`✓ Marked ${res.count} job cards as completed (DELIVERED).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

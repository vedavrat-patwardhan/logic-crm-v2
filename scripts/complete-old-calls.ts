import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Calls that started strictly before 15 May 2026 (local IST midnight).
// 2026-05-15 00:00 IST == 2026-05-14T18:30:00.000Z
const CUTOFF = new Date("2026-05-14T18:30:00.000Z");
const DRY_RUN = process.argv.includes("--dry");
const INCLUDE_SALES = process.argv.includes("--include-sales");

async function main() {
  const base = { startDate: { lt: CUTOFF }, NOT: { status: "COMPLETED" as const } };

  const openService = await prisma.call.count({ where: { ...base, isSales: false } });
  const openSales = await prisma.call.count({ where: { ...base, isSales: true } });
  console.log(`Open (not completed) with startDate < 2026-05-15:`);
  console.log(`  Service calls: ${openService}`);
  console.log(`  Sales leads:   ${openSales}`);

  const where = INCLUDE_SALES ? base : { ...base, isSales: false };
  console.log(`Scope: ${INCLUDE_SALES ? "service + sales" : "service calls only"}`);

  if (DRY_RUN) {
    const sample = await prisma.call.findMany({
      where,
      take: 5,
      orderBy: { startDate: "desc" },
      select: { ticketNo: true, startDate: true, status: true, isSales: true },
    });
    console.log("Sample of records that would change:");
    console.table(
      sample.map((s) => ({
        ticketNo: s.ticketNo,
        startDate: s.startDate.toISOString().slice(0, 10),
        status: s.status,
        sales: s.isSales,
      })),
    );
    return;
  }

  const res = await prisma.call.updateMany({
    where,
    data: { status: "COMPLETED", endDate: new Date() },
  });
  console.log(`✓ Marked ${res.count} calls as completed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import type { PrismaClient } from "@prisma/client";

/** Date key "YYYYMMDD" in Asia/Kolkata (the business timezone). */
export function istDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replaceAll("-", "");
}

/** Atomic per-day ticket number: "YYYYMMDDNN". */
export async function nextTicketNo(prisma: PrismaClient): Promise<string> {
  const key = istDateKey();
  const counter = await prisma.counter.upsert({
    where: { id: `call:${key}` },
    create: { id: `call:${key}`, seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return `${key}${String(counter.seq).padStart(2, "0")}`;
}

/** Atomic global job-card number: "LS0001". */
export async function nextJobNo(prisma: PrismaClient): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { id: "jobcard" },
    create: { id: "jobcard", seq: 1 },
    update: { seq: { increment: 1 } },
  });
  return `LS${String(counter.seq).padStart(4, "0")}`;
}

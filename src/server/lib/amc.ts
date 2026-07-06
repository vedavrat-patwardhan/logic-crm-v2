import type { PrismaClient, AmcSchedule } from "@prisma/client";
import { nextTicketNo } from "./sequences";

type IstContext = {
  dayOfWeek: number;
  weekOfMonth: number;
  monthOfQuarter: number;
};

/** Break a moment into the IST calendar fields the AMC rules match on. */
function istContext(now: Date): IstContext {
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  return {
    dayOfWeek: ist.getDay(),
    weekOfMonth: Math.ceil(ist.getDate() / 7),
    monthOfQuarter: (ist.getMonth() % 3) + 1,
  };
}

/** UTC instants bounding the current IST calendar day (IST = UTC+5:30). */
function istDayRange(now: Date) {
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const startUtc = new Date(
    Date.UTC(ist.getFullYear(), ist.getMonth(), ist.getDate()) -
      5.5 * 60 * 60 * 1000,
  );
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc };
}

/** Does an AMC schedule fall due on the given IST day? */
function isDue(amc: AmcSchedule, ctx: IstContext): boolean {
  switch (amc.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return amc.dayOfWeek === ctx.dayOfWeek;
    case "MONTHLY":
      return (
        amc.weekOfMonth === ctx.weekOfMonth && amc.dayOfWeek === ctx.dayOfWeek
      );
    case "QUARTERLY":
      return (
        amc.monthOfQuarter === ctx.monthOfQuarter &&
        amc.weekOfMonth === ctx.weekOfMonth &&
        amc.dayOfWeek === ctx.dayOfWeek
      );
    default:
      return false;
  }
}

export type AmcRunResult = {
  created: number;
  skipped: number;
  companies: number;
  error?: string;
};

/**
 * Create today's due AMC service calls. Safe to run repeatedly: a company that
 * already has an AMC call for the current IST day is skipped, so re-runs and
 * cron retries never produce duplicates.
 *
 * @param opts.actorId  User to record as the registrar (defaults to an admin).
 * @param opts.now      Override "now" (for testing).
 */
export async function generateDueAmcCalls(
  prisma: PrismaClient,
  opts: { actorId?: string; now?: Date } = {},
): Promise<AmcRunResult> {
  const now = opts.now ?? new Date();
  const ctx = istContext(now);
  const { startUtc, endUtc } = istDayRange(now);

  // Resolve a registrar: the acting user, or fall back to any active admin.
  let registrarId = opts.actorId ?? null;
  if (!registrarId) {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", disabled: false },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    registrarId = admin?.id ?? null;
  }
  if (!registrarId) {
    return { created: 0, skipped: 0, companies: 0, error: "no-registrar" };
  }

  const companies = await prisma.company.findMany({ where: { hasAmc: true } });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let created = 0;
  let skipped = 0;

  for (const company of companies) {
    const dueSchedule = company.amc.find((amc) => isDue(amc, ctx));
    if (!dueSchedule) continue;

    // Idempotency: one AMC call per company per IST day.
    const existing = await prisma.call.findFirst({
      where: {
        companyId: company.id,
        problemType: "AMC Call",
        startDate: { gte: startUtc, lt: endUtc },
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const assignedEmployeeId = dueSchedule.employeeId ?? registrarId;
    // Mirror the manual-create rule: reception-assigned calls stay unallocated.
    const assignee = await prisma.user.findUnique({
      where: { id: assignedEmployeeId },
      select: { role: true },
    });
    const status =
      assignee?.role === "RECEPTION" ? "UNALLOCATED" : "IN_PROGRESS";

    const ticketNo = await nextTicketNo(prisma);
    await prisma.call.create({
      data: {
        ticketNo,
        companyId: company.id,
        contactPerson: company.contactPerson[0]?.name ?? null,
        email: company.contactPerson[0]?.email ?? null,
        mobile: company.contactPerson[0]?.mobile ?? [],
        streetAddress: company.streetAddress,
        city: company.city,
        state: company.state,
        pincode: company.pincode,
        assignedEmployeeId,
        registeredById: registrarId,
        status,
        problemType: "AMC Call",
        startDate: now,
        expClosure: tomorrow,
        isSales: false,
      },
    });
    created += 1;
  }

  return { created, skipped, companies: companies.length };
}

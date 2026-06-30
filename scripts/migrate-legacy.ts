import { PrismaClient, type Role, type CallStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { backupAll, openLegacy } from "./_legacy";

const prisma = new PrismaClient();

// ───────────────────────── helpers ─────────────────────────

function roleFromAuth(auth?: string): Role {
  const a = (auth ?? "").toLowerCase();
  if (a === "admin") return "ADMIN";
  if (a.includes("sales")) return "SALES_ADMIN";
  return "USER";
}

function toDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function statusFromCall(s?: string): CallStatus {
  const v = (s ?? "").toLowerCase();
  if (v.includes("complet")) return "COMPLETED";
  if (v.includes("progress")) return "IN_PROGRESS";
  if (v.includes("unalloc")) return "UNALLOCATED";
  return "IN_PROGRESS";
}

function toMobileArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (v == null || v === "") return [];
  return [String(v)];
}

type LegacyAmc = Record<string, unknown>;
function mapAmc(a: LegacyAmc, userMap: Map<string, string>) {
  let frequency = String(a.frequency ?? "").toUpperCase();
  const dayOfWeek = a.dayOfWeek ?? a.day ?? null;
  const weekOfMonth = a.weekOfMonth ?? a.week ?? null;
  const monthOfQuarter = a.monthOfQuarter ?? null;
  if (!["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"].includes(frequency)) {
    if (monthOfQuarter != null) frequency = "QUARTERLY";
    else if (weekOfMonth != null) frequency = "MONTHLY";
    else if (dayOfWeek != null) frequency = "WEEKLY";
    else frequency = "DAILY";
  }
  return {
    frequency: frequency as "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY",
    dayOfWeek: dayOfWeek != null ? Number(dayOfWeek) : null,
    weekOfMonth: weekOfMonth != null ? Number(weekOfMonth) : null,
    monthOfQuarter: monthOfQuarter != null ? Number(monthOfQuarter) : null,
    employeeId: a.employee ? (userMap.get(String(a.employee)) ?? null) : null,
  };
}

// ───────────────────────── migration ─────────────────────────

async function main() {
  console.log("① Backing up legacy databases first…");
  await backupAll();

  console.log("\n② Reading legacy data…");
  const legacy = await openLegacy();

  try {
    const legacyUsers = await legacy.crmDb.collection("users").find({}).toArray();
    const legacyCompanies = await legacy.crmDb
      .collection("companies")
      .find({})
      .toArray();
    const legacyCalls = await legacy.crmDb.collection("calls").find({}).toArray();
    const legacyJobs = await legacy.jobDb.collection("jobs").find({}).toArray();
    const legacyJobCustomers = await legacy.jobDb
      .collection("companies")
      .find({})
      .toArray();

    console.log(
      `   users=${legacyUsers.length} companies=${legacyCompanies.length} calls=${legacyCalls.length} jobs=${legacyJobs.length} jobCustomers=${legacyJobCustomers.length}`,
    );

    console.log("\n③ Clearing target collections (calls, companies, jobs)…");
    await prisma.call.deleteMany();
    await prisma.company.deleteMany();
    await prisma.jobCard.deleteMany();
    await prisma.jobCardCustomer.deleteMany();
    await prisma.counter.deleteMany();

    // ── Users (upsert by email; preserves bcrypt hashes) ──
    console.log("\n④ Migrating users…");
    const userMap = new Map<string, string>();
    for (const u of legacyUsers) {
      const email = String(u.email ?? "").toLowerCase().trim();
      if (!email) continue;
      const created = await prisma.user.upsert({
        where: { email },
        update: {
          name: String(u.name ?? email),
          role: roleFromAuth(u.auth as string),
          dob: toDate(u.dob),
          mobileNo: toMobileArray(u.mobileNo),
          disabled: !!u.disabled,
        },
        create: {
          name: String(u.name ?? email),
          email,
          password: String(u.password ?? ""),
          role: roleFromAuth(u.auth as string),
          dob: toDate(u.dob),
          mobileNo: toMobileArray(u.mobileNo),
          disabled: !!u.disabled,
        },
        select: { id: true },
      });
      userMap.set(String(u._id), created.id);
    }

    // Ensure a fallback admin exists for orphaned references.
    const adminFallback = await prisma.user.upsert({
      where: { email: "admin@logiccrm.com" },
      update: {},
      create: {
        name: "System Admin",
        email: "admin@logiccrm.com",
        password: await bcrypt.hash("Admin@123", 10),
        role: "ADMIN",
        mobileNo: [],
      },
      select: { id: true },
    });
    const adminId = adminFallback.id;
    console.log(`   ✔ ${userMap.size} users migrated`);

    // ── Companies ──
    console.log("\n⑤ Migrating companies…");
    const companyMap = new Map<string, string>();
    for (const c of legacyCompanies) {
      const contacts = Array.isArray(c.contactPerson) ? c.contactPerson : [];
      const amc = Array.isArray(c.amc) ? c.amc : [];
      const created = await prisma.company.create({
        data: {
          name: String(c.name ?? "Unnamed company"),
          contactPerson: contacts.map((p: Record<string, unknown>) => ({
            name: String(p.name ?? ""),
            email: p.email ? String(p.email) : null,
            mobile: toMobileArray(p.mobile),
          })),
          streetAddress: String(c.streetAddress ?? "—"),
          city: String(c.city ?? "—"),
          state: String(c.state ?? "—"),
          pincode: String(c.pincode ?? "—"),
          hasAmc: !!c.hasAmc,
          amc: c.hasAmc ? amc.map((a: LegacyAmc) => mapAmc(a, userMap)) : [],
          weeklyOff: toMobileArray(c.weeklyOff),
        },
        select: { id: true },
      });
      companyMap.set(String(c._id), created.id);
    }
    console.log(`   ✔ ${companyMap.size} companies migrated`);

    // ── Calls (batched; this is the big collection) ──
    console.log(`\n⑥ Migrating ${legacyCalls.length} calls…`);
    const callSeqByDay = new Map<string, number>();
    const seenTickets = new Set<string>();
    const callData = [];
    for (const c of legacyCalls) {
      const ticketNo = String(c.id ?? "");
      if (!ticketNo || seenTickets.has(ticketNo)) continue;
      seenTickets.add(ticketNo);
      const start = toDate(c.startDate) ?? new Date();
      const actions = Array.isArray(c.actions) ? c.actions : [];
      callData.push({
        ticketNo,
        companyId: c.companyName
          ? (companyMap.get(String(c.companyName)) ?? null)
          : null,
        contactPerson: c.contactPerson ? String(c.contactPerson) : null,
        email: c.email ? String(c.email) : null,
        mobile: toMobileArray(c.mobile),
        streetAddress: String(c.streetAddress ?? "—"),
        city: String(c.city ?? "—"),
        state: String(c.state ?? "—"),
        pincode: String(c.pincode ?? "—"),
        assignedEmployeeId:
          userMap.get(String(c.assignedEmployeeId)) ?? adminId,
        registeredById: userMap.get(String(c.registeredBy)) ?? adminId,
        status: statusFromCall(c.callStatus as string),
        startDate: start,
        endDate: toDate(c.endDate),
        startAction: toDate(c.startAction),
        problemType: String(c.problemType ?? "Other"),
        callDescription: c.callDescription ? String(c.callDescription) : null,
        expClosure: toDate(c.expClosure) ?? start,
        isSales: !!c.isSales,
        actions: actions.map((a: Record<string, unknown>) => ({
          actionTaken: String(a.actionTaken ?? ""),
          actionStarted: toDate(a.actionStarted) ?? start,
          employeeId: userMap.get(String(a.employee)) ?? adminId,
        })),
      });
      const dayKey = ticketNo.slice(0, 8);
      const seq = Number(ticketNo.slice(8)) || 0;
      callSeqByDay.set(dayKey, Math.max(callSeqByDay.get(dayKey) ?? 0, seq));
    }

    let callCount = 0;
    const CHUNK = 1000;
    for (let i = 0; i < callData.length; i += CHUNK) {
      const chunk = callData.slice(i, i + CHUNK);
      try {
        const res = await prisma.call.createMany({ data: chunk });
        callCount += res.count;
      } catch {
        // Fall back to per-doc so one bad row doesn't drop the chunk.
        for (const d of chunk) {
          try {
            await prisma.call.create({ data: d });
            callCount++;
          } catch (e) {
            console.warn(`   ! skipped call ${d.ticketNo}: ${(e as Error).message}`);
          }
        }
      }
      process.stdout.write(`\r   …${callCount}/${callData.length}`);
    }
    console.log(`\n   ✔ ${callCount} calls migrated`);

    // ── Job cards (batched) ──
    console.log(`\n⑦ Migrating ${legacyJobs.length} job cards…`);
    let maxJobSeq = 0;
    const seenJobNos = new Set<string>();
    const jobData = [];
    for (const j of legacyJobs) {
      const jobNo = String(j.jobNo ?? "");
      if (!jobNo || seenJobNos.has(jobNo)) continue;
      seenJobNos.add(jobNo);
      jobData.push({
        jobNo,
        date: toDate(j.date) ?? toDate(j.created_at) ?? new Date(),
        customerName: String(j.customerName ?? "Unknown"),
        companyName: j.companyName ? String(j.companyName) : null,
        mobileNo: j.mobileNo ? String(j.mobileNo) : null,
        material: j.material ? String(j.material) : null,
        accessories: toMobileArray(j.accessories),
        brand: j.brand ? String(j.brand) : null,
        modelNo: j.modelNo ? String(j.modelNo) : null,
        srNo: j.srNo ? String(j.srNo) : null,
        password: j.password ? String(j.password) : null,
        problem: j.problem ? String(j.problem) : null,
        estimate: j.estimate ? String(j.estimate) : null,
        receivedBy: j.receivedBy ? String(j.receivedBy) : null,
        repairedBy: j.repairedBy ? String(j.repairedBy) : null,
        remark: j.remark ? String(j.remark) : null,
        currentStatus: j.currentStatus ? String(j.currentStatus) : null,
        status: (j.done ? "DELIVERED" : "PENDING") as "DELIVERED" | "PENDING",
        done: !!j.done,
      });
      const digits = Number((jobNo.match(/\d+/g) ?? []).join("")) || 0;
      maxJobSeq = Math.max(maxJobSeq, digits);
    }
    let jobCount = 0;
    for (let i = 0; i < jobData.length; i += CHUNK) {
      const chunk = jobData.slice(i, i + CHUNK);
      try {
        const res = await prisma.jobCard.createMany({ data: chunk });
        jobCount += res.count;
      } catch {
        for (const d of chunk) {
          try {
            await prisma.jobCard.create({ data: d });
            jobCount++;
          } catch (e) {
            console.warn(`   ! skipped job ${d.jobNo}: ${(e as Error).message}`);
          }
        }
      }
    }
    console.log(`   ✔ ${jobCount} job cards migrated`);

    // ── Job-card customers ──
    console.log("\n⑧ Migrating job-card customer directory…");
    let jcCount = 0;
    for (const c of legacyJobCustomers) {
      if (!c.customerName) continue;
      await prisma.jobCardCustomer.create({
        data: {
          customerName: String(c.customerName),
          companyName: c.companyName ? String(c.companyName) : null,
          mobileNo: c.mobileNo ? String(c.mobileNo) : null,
        },
      });
      jcCount++;
    }
    console.log(`   ✔ ${jcCount} job-card customers migrated`);

    // ── Sequence counters (so new tickets/jobs continue correctly) ──
    console.log("\n⑨ Resetting sequence counters…");
    for (const [dayKey, seq] of callSeqByDay) {
      await prisma.counter.upsert({
        where: { id: `call:${dayKey}` },
        update: { seq },
        create: { id: `call:${dayKey}`, seq },
      });
    }
    await prisma.counter.upsert({
      where: { id: "jobcard" },
      update: { seq: maxJobSeq },
      create: { id: "jobcard", seq: maxJobSeq },
    });
    console.log(
      `   ✔ counters set (jobcard=${maxJobSeq}, ${callSeqByDay.size} call-day buckets)`,
    );

    console.log("\n✅ Migration complete.");
  } finally {
    await legacy.close();
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

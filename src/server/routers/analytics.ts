import { router, elevatedProcedure } from "../trpc";

export const analyticsRouter = router({
  overview: elevatedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [
      openServiceCalls,
      openSalesLeads,
      completedThisMonth,
      totalCustomers,
      totalUsers,
      amcCompanies,
      openJobCards,
      recent,
      salesByStatus,
    ] = await Promise.all([
      ctx.prisma.call.count({
        where: { isSales: false, status: { not: "COMPLETED" } },
      }),
      ctx.prisma.call.count({
        where: { isSales: true, status: { not: "COMPLETED" } },
      }),
      ctx.prisma.call.count({
        where: { status: "COMPLETED", endDate: { gte: startOfMonth } },
      }),
      ctx.prisma.company.count(),
      ctx.prisma.user.count({ where: { disabled: false } }),
      ctx.prisma.company.count({ where: { hasAmc: true } }),
      ctx.prisma.jobCard.count({ where: { done: false } }),
      ctx.prisma.call.findMany({
        where: { startDate: { gte: since } },
        select: { startDate: true, isSales: true, problemType: true },
      }),
      ctx.prisma.call.groupBy({
        by: ["status"],
        where: { isSales: true },
        _count: { _all: true },
      }),
    ]);

    // 14-day trend buckets.
    const days: { date: string; service: number; sales: number }[] = [];
    const byKey = new Map<string, { service: number; sales: number }>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const bucket = { service: 0, sales: 0 };
      byKey.set(key, bucket);
      days.push({ date: key, ...bucket });
    }
    for (const c of recent) {
      const key = new Date(c.startDate).toISOString().slice(0, 10);
      const bucket = byKey.get(key);
      if (bucket) {
        if (c.isSales) bucket.sales += 1;
        else bucket.service += 1;
      }
    }
    const trend = days.map((d) => ({
      date: d.date,
      service: byKey.get(d.date)?.service ?? 0,
      sales: byKey.get(d.date)?.sales ?? 0,
    }));

    // Problem-type distribution (service calls, top 6).
    const problemCounts = new Map<string, number>();
    for (const c of recent) {
      if (c.isSales) continue;
      problemCounts.set(
        c.problemType,
        (problemCounts.get(c.problemType) ?? 0) + 1,
      );
    }
    const problems = [...problemCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const funnel = salesByStatus.map((s) => ({
      status: s.status,
      count: s._count._all,
    }));

    return {
      kpis: {
        openServiceCalls,
        openSalesLeads,
        completedThisMonth,
        totalCustomers,
        totalUsers,
        amcCompanies,
        openJobCards,
      },
      trend,
      problems,
      funnel,
    };
  }),
});

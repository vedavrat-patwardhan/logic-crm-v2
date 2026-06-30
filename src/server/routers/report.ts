import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { router, elevatedProcedure } from "../trpc";

const rangeInput = {
  start: z.coerce.date(),
  end: z.coerce.date(),
};

function rangeFilter(start: Date, end: Date): Prisma.DateTimeFilter {
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  return { gte: start, lte: endOfDay };
}

export const reportRouter = router({
  employee: elevatedProcedure
    .input(z.object({ employeeId: z.string(), ...rangeInput }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.call.findMany({
        where: {
          assignedEmployeeId: input.employeeId,
          status: "COMPLETED",
          startDate: rangeFilter(input.start, input.end),
        },
        orderBy: { startDate: "desc" },
        include: {
          company: { select: { name: true } },
          registeredBy: { select: { name: true } },
        },
      });
      return rows.map((c) => ({
        ticketNo: c.ticketNo,
        company: c.company?.name ?? c.contactPerson ?? "—",
        problemType: c.problemType,
        description: c.callDescription ?? "",
        startDate: c.startDate,
        endDate: c.endDate,
        expClosure: c.expClosure,
        registeredBy: c.registeredBy?.name ?? "—",
      }));
    }),

  company: elevatedProcedure
    .input(z.object({ companyId: z.string(), ...rangeInput }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.call.findMany({
        where: {
          companyId: input.companyId,
          status: "COMPLETED",
          startDate: rangeFilter(input.start, input.end),
        },
        orderBy: { startDate: "desc" },
        include: {
          assignedEmployee: { select: { name: true } },
          registeredBy: { select: { name: true } },
        },
      });
      return rows.map((c) => ({
        ticketNo: c.ticketNo,
        problemType: c.problemType,
        description: c.callDescription ?? "",
        startDate: c.startDate,
        endDate: c.endDate,
        expClosure: c.expClosure,
        assignedEmployee: c.assignedEmployee?.name ?? "—",
        registeredBy: c.registeredBy?.name ?? "—",
      }));
    }),

  fiscal: elevatedProcedure
    .input(z.object(rangeInput))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.prisma.call.findMany({
        where: { startDate: rangeFilter(input.start, input.end) },
        orderBy: { startDate: "desc" },
        include: {
          company: { select: { name: true } },
          assignedEmployee: { select: { name: true } },
        },
      });
      const empIds = [
        ...new Set(rows.flatMap((c) => c.actions.map((a) => a.employeeId))),
      ];
      const emps = empIds.length
        ? await ctx.prisma.user.findMany({
            where: { id: { in: empIds } },
            select: { id: true, name: true },
          })
        : [];
      const nameById = new Map(emps.map((e) => [e.id, e.name]));

      return rows.map((c) => ({
        ticketNo: c.ticketNo,
        company: c.company?.name ?? c.contactPerson ?? "—",
        initialEmployee: c.assignedEmployee?.name ?? "—",
        engineers: [
          ...new Set(
            c.actions.map((a) => nameById.get(a.employeeId)).filter(Boolean),
          ),
        ].join(", "),
        callType: c.problemType,
        startDate: c.startDate,
      }));
    }),
});

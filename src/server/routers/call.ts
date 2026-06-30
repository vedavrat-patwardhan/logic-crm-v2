import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure, elevatedProcedure } from "../trpc";
import { nextTicketNo } from "../lib/sequences";

const callInput = {
  companyId: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.array(z.string()).default([]),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  assignedEmployeeId: z.string().min(1, "Assign an employee"),
  problemType: z.string().min(1, "Problem type is required"),
  callDescription: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  expClosure: z.coerce.date(),
  isSales: z.boolean().default(false),
};

export const callRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        kind: z.enum(["service", "sales"]).default("service"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().default(""),
        days: z.number().int().positive().optional(),
        includeCompleted: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.CallWhereInput = {
        isSales: input.kind === "sales",
      };

      // Engineers only ever see their own assignments.
      if (ctx.user.role === "USER") {
        where.assignedEmployeeId = ctx.user.id;
      }

      if (!input.includeCompleted) {
        where.status = { not: "COMPLETED" };
      }

      if (input.days) {
        const since = new Date();
        since.setDate(since.getDate() - input.days);
        where.startDate = { gte: since };
      }

      if (input.search) {
        const s = input.search;
        where.OR = [
          { ticketNo: { contains: s, mode: "insensitive" } },
          { problemType: { contains: s, mode: "insensitive" } },
          { contactPerson: { contains: s, mode: "insensitive" } },
          { company: { is: { name: { contains: s, mode: "insensitive" } } } },
          {
            assignedEmployee: {
              is: { name: { contains: s, mode: "insensitive" } },
            },
          },
        ];
      }

      const [rows, total] = await Promise.all([
        ctx.prisma.call.findMany({
          where,
          orderBy: { ticketNo: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          include: {
            company: { select: { name: true } },
            assignedEmployee: { select: { name: true } },
            registeredBy: { select: { name: true } },
          },
        }),
        ctx.prisma.call.count({ where }),
      ]);

      const items = rows.map((c) => ({
        id: c.id,
        ticketNo: c.ticketNo,
        companyName: c.company?.name ?? c.contactPerson ?? "—",
        problemType: c.problemType,
        callDescription: c.callDescription,
        status: c.status,
        assignedEmployeeName: c.assignedEmployee?.name ?? "—",
        registeredByName: c.registeredBy?.name ?? "—",
        startDate: c.startDate,
        expClosure: c.expClosure,
        actionCount: c.actions.length,
        city: c.city,
      }));

      return { items, total };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const call = await ctx.prisma.call.findUnique({
        where: { id: input.id },
        include: {
          company: { select: { id: true, name: true } },
          assignedEmployee: { select: { id: true, name: true } },
          registeredBy: { select: { id: true, name: true } },
        },
      });
      if (!call) throw new TRPCError({ code: "NOT_FOUND" });

      // Resolve action employee names.
      const empIds = [...new Set(call.actions.map((a) => a.employeeId))];
      const emps = empIds.length
        ? await ctx.prisma.user.findMany({
            where: { id: { in: empIds } },
            select: { id: true, name: true },
          })
        : [];
      const nameById = new Map(emps.map((e) => [e.id, e.name]));

      return {
        ...call,
        actions: call.actions.map((a) => ({
          ...a,
          employeeName: nameById.get(a.employeeId) ?? "—",
        })),
      };
    }),

  create: protectedProcedure
    .input(z.object(callInput))
    .mutation(async ({ ctx, input }) => {
      const ticketNo = await nextTicketNo(ctx.prisma);
      const assignedEmployeeId =
        ctx.user.role === "USER" ? ctx.user.id : input.assignedEmployeeId;

      await ctx.prisma.call.create({
        data: {
          ticketNo,
          companyId: input.companyId || null,
          contactPerson: input.contactPerson || null,
          email: input.email || null,
          mobile: input.mobile.filter(Boolean),
          streetAddress: input.streetAddress,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          assignedEmployeeId,
          registeredById: ctx.user.id,
          status: "IN_PROGRESS",
          problemType: input.problemType,
          callDescription: input.callDescription || null,
          startDate: input.startDate,
          expClosure: input.expClosure,
          isSales: input.isSales,
        },
        select: { id: true },
      });
      return { ticketNo };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), ...callInput }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.prisma.call.update({
        where: { id },
        data: {
          companyId: rest.companyId || null,
          contactPerson: rest.contactPerson || null,
          email: rest.email || null,
          mobile: rest.mobile.filter(Boolean),
          streetAddress: rest.streetAddress,
          city: rest.city,
          state: rest.state,
          pincode: rest.pincode,
          assignedEmployeeId: rest.assignedEmployeeId,
          problemType: rest.problemType,
          callDescription: rest.callDescription || null,
          startDate: rest.startDate,
          expClosure: rest.expClosure,
        },
      });
      return { ok: true };
    }),

  addAction: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        actionTaken: z.string().min(1, "Describe the action"),
        employeeId: z.string().min(1, "Select an employee"),
        complete: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const call = await ctx.prisma.call.findUnique({
        where: { id: input.id },
        select: { startAction: true },
      });
      if (!call) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.call.update({
        where: { id: input.id },
        data: {
          actions: {
            push: {
              actionTaken: input.actionTaken,
              actionStarted: new Date(),
              employeeId: input.employeeId,
            },
          },
          assignedEmployeeId: input.employeeId,
          startAction: call.startAction ?? new Date(),
          status: input.complete ? "COMPLETED" : "IN_PROGRESS",
          ...(input.complete ? { endDate: new Date() } : {}),
        },
      });
      return { ok: true };
    }),

  remove: elevatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.call.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});

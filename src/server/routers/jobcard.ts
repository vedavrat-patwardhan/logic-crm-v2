import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "../trpc";
import { nextJobNo } from "../lib/sequences";

const jobInput = {
  customerName: z.string().min(1, "Customer name is required"),
  companyName: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  accessories: z.array(z.string()).default([]),
  brand: z.string().optional().nullable(),
  modelNo: z.string().optional().nullable(),
  srNo: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  problem: z.string().optional().nullable(),
  estimate: z.string().optional().nullable(),
  receivedBy: z.string().min(1, "Received by is required"),
  repairedBy: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "READY", "DELIVERED"]).default(
    "PENDING",
  ),
};

export const jobcardRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.JobCardWhereInput = input.search
        ? {
            OR: [
              {
                jobNo: { contains: input.search, mode: "insensitive" },
              },
              {
                customerName: { contains: input.search, mode: "insensitive" },
              },
              {
                companyName: { contains: input.search, mode: "insensitive" },
              },
            ],
          }
        : {};
      const [items, total] = await Promise.all([
        ctx.prisma.jobCard.findMany({
          where,
          orderBy: [{ done: "asc" }, { createdAt: "desc" }],
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.jobCard.count({ where }),
      ]);
      return { items, total };
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.prisma.jobCard.findUnique({
        where: { id: input.id },
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      return job;
    }),

  customers: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.jobCardCustomer.findMany({ orderBy: { customerName: "asc" } }),
  ),

  addCustomer: protectedProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        companyName: z.string().optional().nullable(),
        mobileNo: z.string().optional().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.jobCardCustomer.create({ data: input, select: { id: true } }),
    ),

  create: protectedProcedure
    .input(z.object(jobInput))
    .mutation(async ({ ctx, input }) => {
      const jobNo = await nextJobNo(ctx.prisma);
      const job = await ctx.prisma.jobCard.create({
        data: {
          ...input,
          jobNo,
          done: input.status === "DELIVERED",
          currentStatus: input.status,
        },
      });
      return job;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), ...jobInput }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.prisma.jobCard.update({
        where: { id },
        data: {
          ...data,
          done: data.status === "DELIVERED",
          currentStatus: data.status,
        },
      });
      return { ok: true };
    }),

  exportAll: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.jobCard.findMany({ orderBy: { createdAt: "desc" } }),
  ),
});

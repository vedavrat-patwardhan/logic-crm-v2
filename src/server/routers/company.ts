import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, elevatedProcedure } from "../trpc";
import { generateDueAmcCalls } from "../lib/amc";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.array(z.string()).default([]),
});

const amcSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  weekOfMonth: z.number().int().min(1).max(4).optional().nullable(),
  monthOfQuarter: z.number().int().min(1).max(3).optional().nullable(),
  employeeId: z.string().optional().nullable(),
});

const companyInput = {
  name: z.string().min(1, "Company name is required"),
  contactPerson: z.array(contactSchema).default([]),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  hasAmc: z.boolean().default(false),
  amc: z.array(amcSchema).default([]),
  weeklyOff: z.array(z.string()).default([]),
};

function normalizeContacts(
  contacts: z.infer<typeof contactSchema>[],
) {
  return contacts.map((c) => ({
    name: c.name,
    email: c.email || null,
    mobile: c.mobile.filter(Boolean),
  }));
}

export const companyRouter = router({
  options: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.prisma.company.findUnique({
        where: { id: input.id },
      });
      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      return company;
    }),

  list: elevatedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" as const } },
              { city: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : {};
      const [items, total] = await Promise.all([
        ctx.prisma.company.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.company.count({ where }),
      ]);
      return { items, total };
    }),

  create: elevatedProcedure
    .input(z.object(companyInput))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.prisma.company.findUnique({
        where: { name: input.name },
      });
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A company with this name already exists.",
        });
      }
      return ctx.prisma.company.create({
        data: {
          ...input,
          contactPerson: normalizeContacts(input.contactPerson),
          amc: input.hasAmc ? input.amc : [],
        },
        select: { id: true },
      });
    }),

  update: elevatedProcedure
    .input(z.object({ id: z.string(), ...companyInput }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.prisma.company.update({
        where: { id },
        data: {
          ...data,
          contactPerson: normalizeContacts(data.contactPerson),
          amc: data.hasAmc ? data.amc : [],
        },
      });
      return { ok: true };
    }),

  remove: elevatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.company.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  /** Generate today's due AMC service calls (idempotent — safe to re-run). */
  generateAmcCalls: elevatedProcedure.mutation(({ ctx }) =>
    generateDueAmcCalls(ctx.prisma, { actorId: ctx.user.id }),
  ),
});

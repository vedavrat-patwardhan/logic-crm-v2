import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  adminProcedure,
} from "../trpc";

const roleEnum = z.enum(["ADMIN", "SALES_ADMIN", "USER"]);

const baseUser = {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  dob: z.coerce.date().optional().nullable(),
  mobileNo: z.array(z.string()).default([]),
  role: roleEnum,
};

export const userRouter = router({
  /** Lightweight {id,name,role} options for dropdowns. */
  options: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { disabled: false },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ),

  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        disabled: false,
        ...(input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: "insensitive" as const } },
                {
                  email: { contains: input.search, mode: "insensitive" as const },
                },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            dob: true,
            mobileNo: true,
            role: true,
            createdAt: true,
          },
        }),
        ctx.prisma.user.count({ where }),
      ]);
      return { items, total };
    }),

  create: adminProcedure
    .input(
      z.object({
        ...baseUser,
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();
      const exists = await ctx.prisma.user.findUnique({ where: { email } });
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists.",
        });
      }
      const password = await bcrypt.hash(input.password, 10);
      return ctx.prisma.user.create({
        data: {
          name: input.name,
          email,
          password,
          dob: input.dob ?? null,
          mobileNo: input.mobileNo,
          role: input.role,
        },
        select: { id: true },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        ...baseUser,
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional()
          .or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Record<string, unknown> = {
        name: input.name,
        email: input.email.toLowerCase().trim(),
        dob: input.dob ?? null,
        mobileNo: input.mobileNo,
        role: input.role,
      };
      if (input.password) {
        data.password = await bcrypt.hash(input.password, 10);
      }
      await ctx.prisma.user.update({ where: { id: input.id }, data });
      return { ok: true };
    }),

  /** Soft delete. */
  disable: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't disable your own account.",
        });
      }
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { disabled: true },
      });
      return { ok: true };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const ok = await bcrypt.compare(input.currentPassword, user.password);
      if (!ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Current password is incorrect.",
        });
      }
      const password = await bcrypt.hash(input.newPassword, 10);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { password },
      });
      return { ok: true };
    }),
});

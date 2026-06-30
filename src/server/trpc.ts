import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Role } from "@prisma/client";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

/** Requires a signed-in user; narrows ctx.session to non-null. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in.",
    });
  }
  return next({
    ctx: { session: ctx.session, user: ctx.session.user, prisma: ctx.prisma },
  });
});

const enforceRole = (roles: Role[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roles.includes(ctx.session.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to perform this action.",
      });
    }
    return next({
      ctx: { session: ctx.session, user: ctx.session.user, prisma: ctx.prisma },
    });
  });

export const protectedProcedure = t.procedure.use(enforceAuth);
export const elevatedProcedure = t.procedure.use(
  enforceRole(["ADMIN", "SALES_ADMIN"]),
);
export const adminProcedure = t.procedure.use(enforceRole(["ADMIN"]));

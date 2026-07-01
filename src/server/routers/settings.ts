import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { loadAppSetting, SETTINGS_ID } from "../lib/settings";
import { resolveMatrix, type PermissionMatrix } from "../../lib/permissions";

export const settingsRouter = router({
  /** Effective config for the client (resolved permission matrix). */
  get: protectedProcedure.query(async ({ ctx }) => {
    const s = await loadAppSetting(ctx.prisma);
    return {
      permissions: resolveMatrix(
        (s?.permissions as PermissionMatrix | undefined) ?? null,
      ),
    };
  }),

  updatePermissions: adminProcedure
    .input(
      z.object({
        permissions: z.record(
          z.string(),
          z.record(z.string(), z.boolean()),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.appSetting.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, permissions: input.permissions },
        update: { permissions: input.permissions },
      });
      return { ok: true };
    }),
});

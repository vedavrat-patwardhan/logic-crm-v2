import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { loadAppSetting, SETTINGS_ID } from "../lib/settings";
import { resolveMatrix, type PermissionMatrix } from "../../lib/permissions";

export const settingsRouter = router({
  /** Effective config for the client (resolved permission matrix + defaults). */
  get: protectedProcedure.query(async ({ ctx }) => {
    const s = await loadAppSetting(ctx.prisma);
    return {
      permissions: resolveMatrix(
        (s?.permissions as PermissionMatrix | undefined) ?? null,
      ),
      defaultAssigneeId: s?.defaultAssigneeId ?? null,
      dropdownOptions: s?.dropdownOptions ?? null,
    };
  }),

  updateDefaults: adminProcedure
    .input(z.object({ defaultAssigneeId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const value = input.defaultAssigneeId || null;
      await ctx.prisma.appSetting.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, defaultAssigneeId: value },
        update: { defaultAssigneeId: value },
      });
      return { ok: true };
    }),

  updateDropdowns: adminProcedure
    .input(z.object({ dropdownOptions: z.record(z.string(), z.array(z.string())) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.appSetting.upsert({
        where: { id: SETTINGS_ID },
        create: { id: SETTINGS_ID, dropdownOptions: input.dropdownOptions },
        update: { dropdownOptions: input.dropdownOptions },
      });
      return { ok: true };
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

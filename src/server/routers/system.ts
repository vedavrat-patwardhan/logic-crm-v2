import { router, protectedProcedure, publicProcedure } from "../trpc";

export const systemRouter = router({
  health: publicProcedure.query(() => ({ ok: true, ts: Date.now() })),

  me: protectedProcedure.query(({ ctx }) => ctx.user),
});

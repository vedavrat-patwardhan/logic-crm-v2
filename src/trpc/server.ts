import "server-only";
import { cache } from "react";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/context";

/**
 * Server-side tRPC caller for React Server Components.
 * Usage: `const data = await api.system.me()`
 */
const createCaller = createCallerFactory(appRouter);

export const getApi = cache(async () => {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
});

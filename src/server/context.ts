import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Per-request tRPC context. Available to every procedure.
 */
export async function createTRPCContext() {
  const session = await auth();
  return { session, prisma };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

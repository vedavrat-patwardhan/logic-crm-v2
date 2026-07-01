import type { PrismaClient } from "@prisma/client";
import type { PermissionMatrix } from "../../lib/permissions";

export const SETTINGS_ID = "app";

/** Load the singleton settings document, or null if not yet created. */
export function loadAppSetting(prisma: PrismaClient) {
  return prisma.appSetting.findUnique({ where: { id: SETTINGS_ID } });
}

/** Stored permission overrides (raw), or null when nothing has been customised. */
export async function getStoredMatrix(
  prisma: PrismaClient,
): Promise<PermissionMatrix | null> {
  const s = await prisma.appSetting.findUnique({
    where: { id: SETTINGS_ID },
    select: { permissions: true },
  });
  return (s?.permissions as PermissionMatrix | undefined) ?? null;
}

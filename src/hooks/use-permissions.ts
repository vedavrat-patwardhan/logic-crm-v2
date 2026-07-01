"use client";

import type { Role } from "@prisma/client";
import { trpc } from "@/trpc/react";
import { can as staticCan, type PermissionKey } from "@/lib/permissions";

/**
 * Returns a `check(key)` function for the given role. While the stored matrix
 * loads (or if it fails), it falls back to the built-in defaults so the UI is
 * never left in a broken state.
 */
export function usePermissions(role: Role) {
  const { data } = trpc.settings.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  return (key: PermissionKey): boolean => {
    const fromServer = data?.permissions?.[role]?.[key];
    if (typeof fromServer === "boolean") return fromServer;
    return staticCan(role, key);
  };
}

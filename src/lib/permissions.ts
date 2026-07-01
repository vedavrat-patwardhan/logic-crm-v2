import type { Role } from "@prisma/client";

/**
 * Central permission registry. Each permission gates a specific UI control and/or
 * server mutation. Defaults live here; admins can override them per-role via the
 * Settings → Access Control screen (persisted in AppSetting.permissions).
 */
export const PERMISSION_GROUPS = [
  {
    label: "Calls & Sales",
    permissions: [
      { key: "calls.create", label: "Create calls", desc: "Log new service calls and leads" },
      { key: "calls.edit", label: "Edit calls", desc: "Modify existing call details" },
      { key: "calls.delete", label: "Delete calls", desc: "Permanently remove calls" },
      { key: "calls.addAction", label: "Add actions", desc: "Record remarks and close calls" },
      { key: "calls.showClosed", label: "Show closed calls", desc: "Toggle completed calls in the list" },
      { key: "calls.dateFilter", label: "Use date filter", desc: "Filter calls by time range" },
    ],
  },
] as const;

export type PermissionKey =
  (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap(
  (g) => g.permissions.map((p) => p.key),
);

/** A role → (permission → allowed) map. Stored as JSON; keys may be partial. */
export type PermissionMatrix = Partial<
  Record<Role, Partial<Record<PermissionKey, boolean>>>
>;

/** Built-in defaults. Admins get everything; others are restricted. */
export const DEFAULT_PERMISSIONS: Record<
  Role,
  Record<PermissionKey, boolean>
> = {
  ADMIN: {
    "calls.create": true,
    "calls.edit": true,
    "calls.delete": true,
    "calls.addAction": true,
    "calls.showClosed": true,
    "calls.dateFilter": true,
  },
  SALES_ADMIN: {
    "calls.create": true,
    "calls.edit": false,
    "calls.delete": false,
    "calls.addAction": true,
    "calls.showClosed": true,
    "calls.dateFilter": true,
  },
  USER: {
    "calls.create": true,
    "calls.edit": false,
    "calls.delete": false,
    "calls.addAction": true,
    "calls.showClosed": false,
    "calls.dateFilter": false,
  },
};

/** Resolve a single permission for a role, honouring an optional stored override. */
export function can(
  role: Role,
  key: PermissionKey,
  matrix?: PermissionMatrix | null,
): boolean {
  const override = matrix?.[role]?.[key];
  if (typeof override === "boolean") return override;
  return DEFAULT_PERMISSIONS[role]?.[key] ?? false;
}

/** Merge stored overrides on top of defaults to produce a full matrix. */
export function resolveMatrix(
  matrix?: PermissionMatrix | null,
): Record<Role, Record<PermissionKey, boolean>> {
  const roles = Object.keys(DEFAULT_PERMISSIONS) as Role[];
  return Object.fromEntries(
    roles.map((role) => [
      role,
      Object.fromEntries(
        ALL_PERMISSION_KEYS.map((key) => [key, can(role, key, matrix)]),
      ) as Record<PermissionKey, boolean>,
    ]),
  ) as Record<Role, Record<PermissionKey, boolean>>;
}

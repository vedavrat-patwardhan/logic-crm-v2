"use client";

import * as React from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import { trpc } from "@/trpc/react";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import {
  PERMISSION_GROUPS,
  ALL_PERMISSION_KEYS,
  resolveMatrix,
  type PermissionKey,
} from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Matrix = Record<Role, Record<PermissionKey, boolean>>;

export function AccessControl() {
  const utils = trpc.useUtils();
  const query = trpc.settings.get.useQuery();
  const save = trpc.settings.updatePermissions.useMutation();

  const [matrix, setMatrix] = React.useState<Matrix | null>(null);

  React.useEffect(() => {
    if (query.data?.permissions) {
      setMatrix(query.data.permissions as Matrix);
    }
  }, [query.data]);

  function toggle(role: Role, key: PermissionKey, value: boolean) {
    setMatrix((prev) => {
      const base = prev ?? resolveMatrix(null);
      return {
        ...base,
        [role]: { ...base[role], [key]: value },
      };
    });
  }

  async function onSave() {
    if (!matrix) return;
    try {
      await save.mutateAsync({ permissions: matrix });
      await utils.settings.get.invalidate();
      toast.success("Access control updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  function onReset() {
    setMatrix(resolveMatrix(null));
  }

  if (query.isLoading || !matrix) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Role permissions
          </CardTitle>
          <CardDescription>
            Choose what each role can do. Admins always retain full access.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset to defaults
          </Button>
          <Button size="sm" onClick={onSave} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium">Permission</th>
                    {ROLES.map((role) => (
                      <th
                        key={role}
                        className="px-3 py-2 text-center font-medium"
                      >
                        {ROLE_LABELS[role]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.permissions.map((perm) => (
                    <tr key={perm.key} className="border-b last:border-0">
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {perm.desc}
                        </p>
                      </td>
                      {ROLES.map((role) => {
                        const isAdmin = role === "ADMIN";
                        return (
                          <td key={role} className="px-3 py-2.5 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={isAdmin ? true : matrix[role][perm.key]}
                                disabled={isAdmin}
                                onCheckedChange={(v) =>
                                  toggle(role, perm.key, v)
                                }
                                aria-label={`${ROLE_LABELS[role]} — ${perm.label}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          {ALL_PERMISSION_KEYS.length} permissions across{" "}
          {PERMISSION_GROUPS.length} group
          {PERMISSION_GROUPS.length === 1 ? "" : "s"}.
        </p>
      </CardContent>
    </Card>
  );
}

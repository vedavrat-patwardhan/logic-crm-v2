"use client";

import * as React from "react";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/data/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DefaultsConfig() {
  const utils = trpc.useUtils();
  const settings = trpc.settings.get.useQuery();
  const users = trpc.user.options.useQuery();
  const save = trpc.settings.updateDefaults.useMutation();

  const [assigneeId, setAssigneeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (settings.data) setAssigneeId(settings.data.defaultAssigneeId ?? null);
  }, [settings.data]);

  async function onSave() {
    try {
      await save.mutateAsync({ defaultAssigneeId: assigneeId });
      await utils.settings.get.invalidate();
      toast.success("Defaults updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  if (settings.isLoading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="size-4 text-primary" />
          Call defaults
        </CardTitle>
        <CardDescription>
          Preselect an engineer when creating a new call. Individual calls can
          still be reassigned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm space-y-2">
          <Label>Default &ldquo;Assign to&rdquo;</Label>
          <Combobox
            options={(users.data ?? []).map((u) => ({
              value: u.id,
              label: u.name,
            }))}
            value={assigneeId}
            onChange={setAssigneeId}
            placeholder="No default (choose each time)"
          />
          <p className="text-xs text-muted-foreground">
            Used as the initial assignee for new calls created by admins and
            sales admins.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            Save defaults
          </Button>
          {assigneeId && (
            <Button variant="ghost" onClick={() => setAssigneeId(null)}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

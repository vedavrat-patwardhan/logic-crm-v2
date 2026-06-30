"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { REMARKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/data/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ActionDialog({
  open,
  onOpenChange,
  callId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  callId: string | null;
}) {
  const utils = trpc.useUtils();
  const userOptions = trpc.user.options.useQuery(undefined, { enabled: open });
  const [employeeId, setEmployeeId] = React.useState<string | null>(null);
  const [actionTaken, setActionTaken] = React.useState("");
  const [complete, setComplete] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setEmployeeId(null);
      setActionTaken("");
      setComplete(false);
    }
  }, [open]);

  const addAction = trpc.calls.addAction.useMutation();

  async function submit() {
    if (!callId) return;
    if (!employeeId) return toast.error("Select an employee");
    if (!actionTaken.trim()) return toast.error("Describe the action");
    try {
      await addAction.mutateAsync({
        id: callId,
        employeeId,
        actionTaken: actionTaken.trim(),
        complete,
      });
      toast.success(complete ? "Call closed" : "Action added");
      await Promise.all([
        utils.calls.list.invalidate(),
        utils.calls.byId.invalidate({ id: callId }),
      ]);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add action");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add action</DialogTitle>
          <DialogDescription>
            Record a remark, forward to an engineer, or close the call.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Forward to / handled by</Label>
            <Combobox
              options={(userOptions.data ?? []).map((u) => ({
                value: u.id,
                label: u.name,
              }))}
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="Select employee"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-taken">Remark</Label>
            <Input
              id="action-taken"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="What was done?"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {REMARKS.map((r) => (
                <Badge
                  key={r}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/70"
                  onClick={() => setActionTaken(r)}
                >
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 rounded-lg border p-3">
            <Checkbox
              checked={complete}
              onCheckedChange={(v) => setComplete(v === true)}
            />
            <div>
              <p className="text-sm font-medium">Close this call</p>
              <p className="text-xs text-muted-foreground">
                Marks the call completed and stamps the end date.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={addAction.isPending}>
            {addAction.isPending && <Loader2 className="size-4 animate-spin" />}
            {complete ? "Close call" : "Add action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

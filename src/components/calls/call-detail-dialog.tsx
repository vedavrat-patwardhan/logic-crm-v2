"use client";

import { MapPin, Phone, Mail, User2, Clock } from "lucide-react";
import { trpc } from "@/trpc/react";
import { formatDate, formatDateTime, formatPhone } from "@/lib/format";
import { CallStatusBadge } from "./status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

export function CallDetailDialog({
  open,
  onOpenChange,
  callId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  callId: string | null;
}) {
  const { data, isLoading } = trpc.calls.byId.useQuery(
    { id: callId! },
    { enabled: open && !!callId },
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">{data?.ticketNo ?? "Call"}</span>
            {data ? <CallStatusBadge status={data.status} /> : null}
          </SheetTitle>
          <SheetDescription>
            {data?.problemType ?? "Loading call details…"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {isLoading || !data ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                <Row
                  icon={User2}
                  label="Company / Contact"
                  value={data.company?.name ?? data.contactPerson}
                />
                <Row icon={Phone} label="Mobile" value={formatPhone(data.mobile)} />
                <Row icon={Mail} label="Email" value={data.email} />
                <Row
                  icon={MapPin}
                  label="Address"
                  value={`${data.streetAddress}, ${data.city}, ${data.state} ${data.pincode}`}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Row icon={User2} label="Assigned" value={data.assignedEmployee?.name} />
                <Row icon={User2} label="Registered by" value={data.registeredBy?.name} />
                <Row icon={Clock} label="Started" value={formatDate(data.startDate)} />
                <Row icon={Clock} label="Expected closure" value={formatDate(data.expClosure)} />
              </div>

              {data.callDescription ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Description</p>
                    <p className="text-sm leading-relaxed">
                      {data.callDescription}
                    </p>
                  </div>
                </>
              ) : null}

              <Separator />

              <div>
                <p className="mb-3 text-sm font-semibold">
                  Action history ({data.actions.length})
                </p>
                {data.actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No actions recorded yet.
                  </p>
                ) : (
                  <ol className="relative space-y-4 border-l pl-5">
                    {data.actions.map((a, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[1.45rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <p className="text-sm font-medium">{a.actionTaken}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.employeeName} · {formatDateTime(a.actionStarted)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

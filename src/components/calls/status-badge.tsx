import type { CallStatus, JobStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CALL_STATUS_LABELS, JOB_STATUS_LABELS } from "@/lib/constants";

const CALL_STYLES: Record<CallStatus, string> = {
  UNALLOCATED:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  IN_PROGRESS:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  COMPLETED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const JOB_STYLES: Record<JobStatus, string> = {
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  IN_PROGRESS:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  READY:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  DELIVERED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", CALL_STYLES[status])}>
      {CALL_STATUS_LABELS[status]}
    </Badge>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", JOB_STYLES[status])}>
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}

"use client";

import * as React from "react";
import type { Role } from "@prisma/client";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  MessageSquarePlus,
  Trash2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/data/list-toolbar";
import { DataPagination } from "@/components/data/data-pagination";
import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PhoneCall, TrendingUp } from "lucide-react";
import { CallStatusBadge } from "./status-badge";
import { CallFormDialog } from "./call-form-dialog";
import { ActionDialog } from "./action-dialog";
import { CallDetailDialog } from "./call-detail-dialog";

const DAY_FILTERS = [
  { value: "all", label: "All time" },
  { value: "1", label: "Last 24h" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function CallsView({
  kind,
  role,
  userId,
}: {
  kind: "service" | "sales";
  role: Role;
  userId: string;
}) {
  const utils = trpc.useUtils();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [days, setDays] = React.useState("all");
  const [includeCompleted, setIncludeCompleted] = React.useState(false);
  const debounced = useDebouncedValue(search);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [actionId, setActionId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => setPage(1), [debounced, days, includeCompleted, pageSize]);

  const list = trpc.calls.list.useQuery({
    kind,
    page,
    pageSize,
    search: debounced,
    includeCompleted,
    ...(days !== "all" ? { days: Number(days) } : {}),
  });

  const removeMut = trpc.calls.remove.useMutation();
  const isElevated = role !== "USER";
  const noun = kind === "sales" ? "Lead" : "Call";

  const check = usePermissions(role);
  const canCreate = check("calls.create");
  const canEdit = check("calls.edit");
  const canDelete = check("calls.delete");
  const canShowClosed = check("calls.showClosed");
  const canDateFilter = check("calls.dateFilter");

  function openNew() {
    setEditId(null);
    setFormOpen(true);
  }
  function openEdit(id: string) {
    setEditId(id);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await removeMut.mutateAsync({ id: deleteId });
      toast.success(`${noun} deleted`);
      await utils.calls.list.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === "sales" ? "Sales Pipeline" : "Service Calls"}
        description={
          kind === "sales"
            ? "Track leads, quotations and follow-ups."
            : "Track, assign and close service tickets."
        }
      >
        {canCreate && (
          <Button onClick={openNew}>
            <Plus className="size-4" />
            New {noun.toLowerCase()}
          </Button>
        )}
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ticket, company, engineer…"
        right={
          canShowClosed ? (
            <Button
              variant={includeCompleted ? "default" : "outline"}
              onClick={() => setIncludeCompleted((v) => !v)}
              size="sm"
            >
              {includeCompleted ? "Showing closed" : "Show closed"}
            </Button>
          ) : undefined
        }
      >
        {canDateFilter && (
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]" size="sm">
              <CalendarClock className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_FILTERS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </ListToolbar>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Ticket</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>{kind === "sales" ? "Lead type" : "Problem"}</TableHead>
                <TableHead>Status</TableHead>
                {isElevated && <TableHead>Assigned</TableHead>}
                <TableHead>Started</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isElevated ? 8 : 7}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isElevated ? 8 : 7} className="p-0">
                    <EmptyState
                      icon={kind === "sales" ? TrendingUp : PhoneCall}
                      title={`No ${noun.toLowerCase()}s found`}
                      description="Try adjusting filters, or create a new one."
                      className="border-0"
                    >
                      {canCreate && (
                        <Button onClick={openNew} variant="outline">
                          <Plus className="size-4" />
                          New {noun.toLowerCase()}
                        </Button>
                      )}
                    </EmptyState>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setDetailId(c.id)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {c.ticketNo}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {c.companyName}
                    </TableCell>
                    <TableCell>{c.problemType}</TableCell>
                    <TableCell>
                      <CallStatusBadge status={c.status} />
                    </TableCell>
                    {isElevated && (
                      <TableCell className="text-muted-foreground">
                        {c.assignedEmployeeName}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {formatDate(c.startDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{c.actionCount}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDetailId(c.id)}>
                            <Eye className="size-4" />
                            View
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onSelect={() => openEdit(c.id)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onSelect={() => setActionId(c.id)}>
                            <MessageSquarePlus className="size-4" />
                            Add action
                          </DropdownMenuItem>
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteId(c.id)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataPagination
        page={page}
        pageSize={pageSize}
        total={list.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <CallFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        kind={kind}
        editId={editId}
        role={role}
        userId={userId}
      />
      <ActionDialog
        open={!!actionId}
        onOpenChange={(o) => !o && setActionId(null)}
        callId={actionId}
      />
      <CallDetailDialog
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        callId={detailId}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={`Delete this ${noun.toLowerCase()}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={removeMut.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

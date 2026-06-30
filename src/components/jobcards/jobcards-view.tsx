"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Download,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { printHtml } from "@/lib/print";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/data/list-toolbar";
import { DataPagination } from "@/components/data/data-pagination";
import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { JobStatusBadge } from "@/components/calls/status-badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobCardFormDialog } from "./jobcard-form-dialog";
import { JobCardDetailDialog } from "./jobcard-detail-dialog";

const COLS = 7;

function escHtml(value?: string | null): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ((
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as Record<string, string>
      )[c] ?? c),
  );
}

export function JobCardsView() {
  const utils = trpc.useUtils();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [printOffer, setPrintOffer] = React.useState<{
    jobNo: string;
    date: Date | string;
    customerName: string;
  } | null>(null);

  React.useEffect(() => setPage(1), [debounced, pageSize]);

  const list = trpc.jobcard.list.useQuery({
    page,
    pageSize,
    search: debounced,
  });

  function openNew() {
    setEditId(null);
    setFormOpen(true);
  }
  function openEdit(id: string) {
    setEditId(id);
    setFormOpen(true);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const rows = await utils.jobcard.exportAll.fetch();
      const header = [
        "Job No",
        "Date",
        "Company",
        "Customer",
        "Mobile",
        "Material",
        "Model",
        "Serial",
        "Problem",
        "Remark",
        "Status",
      ];
      const body = rows.map((j) => [
        j.jobNo,
        formatDate(j.date),
        j.companyName ?? "",
        j.customerName,
        j.mobileNo ?? "",
        j.material ?? "",
        j.modelNo ?? "",
        j.srNo ?? "",
        j.problem ?? "",
        j.remark ?? "",
        j.status,
      ]);
      const today = new Date().toISOString().slice(0, 10);
      downloadCsv(`job-cards-${today}`, [header, ...body]);
      toast.success(`Exported ${rows.length} job cards`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function printSticker(job: {
    jobNo: string;
    date: Date | string;
    customerName: string;
  }) {
    printHtml({
      title: job.jobNo,
      body: `<div style="padding:8px;width:280px"><div style="font-size:20px;font-weight:800">${escHtml(
        job.jobNo,
      )}</div><div style="font-size:12px">${escHtml(
        formatDate(job.date),
      )}</div><div style="font-size:12px">${escHtml(
        job.customerName,
      )}</div></div>`,
      styles: "@page{size:auto;margin:6mm}",
    });
  }

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Cards"
        description="Device intake, repair tracking and handover."
      >
        <Button variant="outline" onClick={exportCsv} disabled={exporting}>
          <Download className="size-4" />
          Export CSV
        </Button>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          New job card
        </Button>
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search job no or customer…"
      />

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Job No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={COLS}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS} className="p-0">
                    <EmptyState
                      icon={ClipboardList}
                      title="No job cards found"
                      description="Create a job card to start tracking a repair."
                      className="border-0"
                    >
                      <Button onClick={openNew} variant="outline">
                        <Plus className="size-4" />
                        New job card
                      </Button>
                    </EmptyState>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((j) => (
                  <TableRow
                    key={j.id}
                    className="cursor-pointer"
                    onClick={() => setDetailId(j.id)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {j.jobNo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(j.date)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {j.customerName}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {j.companyName || "—"}
                    </TableCell>
                    <TableCell>{j.material || "—"}</TableCell>
                    <TableCell>
                      <JobStatusBadge status={j.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDetailId(j.id)}>
                            <Eye className="size-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(j.id)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
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

      <JobCardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editId}
        onCreated={(job) => {
          setPrintOffer(job);
          void utils.jobcard.list.invalidate();
        }}
      />
      <JobCardDetailDialog
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        jobId={detailId}
      />
      <ConfirmDialog
        open={!!printOffer}
        onOpenChange={(o) => !o && setPrintOffer(null)}
        title="Print sticker?"
        description={
          printOffer
            ? `Job card ${printOffer.jobNo} created. Print a device sticker now?`
            : undefined
        }
        confirmLabel="Print sticker"
        cancelLabel="Not now"
        onConfirm={() => {
          if (printOffer) printSticker(printOffer);
          setPrintOffer(null);
        }}
      />
    </div>
  );
}

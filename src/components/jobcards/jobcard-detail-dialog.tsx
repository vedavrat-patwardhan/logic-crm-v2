"use client";

import {
  User2,
  Building2,
  Phone,
  Cpu,
  Tag,
  Hash,
  KeyRound,
  Wrench,
  IndianRupee,
  StickyNote,
  Printer,
  ReceiptText,
  Clock,
  ListChecks,
} from "lucide-react";

import { trpc } from "@/trpc/react";
import { formatDate, formatPhone } from "@/lib/format";
import { printHtml } from "@/lib/print";
import { JobStatusBadge } from "@/components/calls/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function esc(value?: string | null): string {
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

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User2;
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

export function JobCardDetailDialog({
  open,
  onOpenChange,
  jobId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  jobId: string | null;
}) {
  const { data, isLoading } = trpc.jobcard.byId.useQuery(
    { id: jobId! },
    { enabled: open && !!jobId },
  );

  function printSticker() {
    if (!data) return;
    printHtml({
      title: data.jobNo,
      body: `<div style="padding:8px;width:280px"><div style="font-size:20px;font-weight:800">${esc(
        data.jobNo,
      )}</div><div style="font-size:12px">${esc(
        formatDate(data.date),
      )}</div><div style="font-size:12px">${esc(
        data.customerName,
      )}</div></div>`,
      styles: "@page{size:auto;margin:6mm}",
    });
  }

  function printReceipt() {
    if (!data) return;
    const cell = (label: string, value?: string | null) =>
      `<div style="border:1px solid #e2e8f0;padding:8px 10px">
        <div style="font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:#64748b">${esc(
          label,
        )}</div>
        <div style="font-size:13px;font-weight:600;color:#0f172a;margin-top:2px">${
          esc(value) || "—"
        }</div>
      </div>`;

    const body = `
      <div style="max-width:560px;margin:0 auto;color:#0f172a">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:14px">
          <div>
            <div style="font-size:22px;font-weight:800;letter-spacing:-.01em">Logic Systems</div>
            <div style="font-size:12px;color:#475569">Service Receipt</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;font-family:ui-monospace,monospace">${esc(
              data.jobNo,
            )}</div>
            <div style="font-size:12px;color:#475569">${esc(
              formatDate(data.date),
            )}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${cell("Job No", data.jobNo)}
          ${cell("Date", formatDate(data.date))}
          ${cell("Customer", data.customerName)}
          ${cell("Company", data.companyName)}
          ${cell("Mobile", formatPhone(data.mobileNo))}
          ${cell("Material", data.material)}
          ${cell("Brand", data.brand)}
          ${cell("Model", data.modelNo)}
          ${cell("Serial", data.srNo)}
          ${cell("Accessories", data.accessories.join(", "))}
        </div>
        <div style="margin-top:8px;display:grid;gap:8px">
          ${cell("Problem", data.problem)}
          ${cell("Estimate", data.estimate)}
          ${cell("Received By", data.receivedBy)}
        </div>
        <div style="margin-top:18px;display:flex;justify-content:space-between;font-size:11px;color:#475569">
          <span>Customer Signature</span>
          <span>For Logic Systems</span>
        </div>
      </div>`;

    printHtml({
      title: `Receipt ${data.jobNo}`,
      body,
      styles: "@page{size:A5;margin:10mm}",
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">{data?.jobNo ?? "Job Card"}</span>
            {data ? <JobStatusBadge status={data.status} /> : null}
          </SheetTitle>
          <SheetDescription>
            {data?.customerName ?? "Loading job card details…"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {isLoading || !data ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={printSticker}>
                  <Printer className="size-4" />
                  Print sticker
                </Button>
                <Button variant="outline" className="flex-1" onClick={printReceipt}>
                  <ReceiptText className="size-4" />
                  Print receipt
                </Button>
              </div>

              <Separator />

              <div className="grid gap-4">
                <Row icon={User2} label="Customer" value={data.customerName} />
                <Row icon={Building2} label="Company" value={data.companyName} />
                <Row icon={Phone} label="Mobile" value={formatPhone(data.mobileNo)} />
                <Row icon={Clock} label="Date" value={formatDate(data.date)} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Row icon={Cpu} label="Material" value={data.material} />
                <Row icon={Tag} label="Brand" value={data.brand} />
                <Row icon={Hash} label="Model No" value={data.modelNo} />
                <Row icon={Hash} label="Serial No" value={data.srNo} />
                <Row icon={KeyRound} label="Password" value={data.password} />
                <Row
                  icon={ListChecks}
                  label="Accessories"
                  value={data.accessories.length ? data.accessories.join(", ") : "—"}
                />
              </div>

              <Separator />

              <div className="grid gap-4">
                <Row icon={Wrench} label="Problem" value={data.problem} />
                <Row icon={IndianRupee} label="Estimate" value={data.estimate} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <Row icon={User2} label="Received by" value={data.receivedBy} />
                <Row icon={Wrench} label="Repaired by" value={data.repairedBy} />
                <Row
                  icon={ListChecks}
                  label="Current status"
                  value={data.currentStatus}
                />
              </div>

              {data.remark ? (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Remark</p>
                      <p className="text-sm leading-relaxed break-words">
                        {data.remark}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

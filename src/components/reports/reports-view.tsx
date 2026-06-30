"use client";

import * as React from "react";
import { Download, FileBarChart, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { formatDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Combobox } from "@/components/data/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  csv: (row: T) => string;
  mono?: boolean;
};

/** Shared date-range inputs. */
function DateRangeFields({
  start,
  end,
  onStart,
  onEnd,
  idPrefix,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  idPrefix: string;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-start`}>Start date</Label>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          value={start}
          max={end || undefined}
          onChange={(e) => onStart(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-end`}>End date</Label>
        <Input
          id={`${idPrefix}-end`}
          type="date"
          value={end}
          min={start || undefined}
          onChange={(e) => onEnd(e.target.value)}
        />
      </div>
    </>
  );
}

/** Shared results region: empty state, no-results, or a results table with CSV export. */
function ReportResults<T>({
  rows,
  columns,
  filename,
  hasRun,
  loading,
}: {
  rows: T[] | null;
  columns: Column<T>[];
  filename: string;
  hasRun: boolean;
  loading: boolean;
}) {
  function handleExport() {
    if (!rows || rows.length === 0) return;
    const csv = [
      columns.map((c) => c.header),
      ...rows.map((r) => columns.map((c) => c.csv(r))),
    ];
    downloadCsv(filename, csv);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed bg-card/40 px-6 py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Generating report…
      </div>
    );
  }

  if (!hasRun || rows === null) {
    return (
      <EmptyState
        icon={FileBarChart}
        title="No report yet"
        description="Generate a report to see results."
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileBarChart}
        title="No records"
        description="No records in this range."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} record{rows.length === 1 ? "" : "s"}
        </p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          Download CSV
        </Button>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.header}>{c.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell
                      key={c.header}
                      className={c.mono ? "font-mono text-xs" : undefined}
                    >
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

type EmployeeRow = {
  ticketNo: string;
  company: string;
  problemType: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  expClosure: Date | null;
  registeredBy: string;
};

type CompanyRow = {
  ticketNo: string;
  problemType: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  expClosure: Date | null;
  assignedEmployee: string;
  registeredBy: string;
};

type FiscalRow = {
  ticketNo: string;
  company: string;
  initialEmployee: string;
  engineers: string;
  callType: string;
  startDate: Date;
};

function EmployeeTab() {
  const utils = trpc.useUtils();
  const users = trpc.user.options.useQuery();
  const [employeeId, setEmployeeId] = React.useState<string | null>(null);
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [rows, setRows] = React.useState<EmployeeRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const userOptions = (users.data ?? []).map((u) => ({
    value: u.id,
    label: u.name,
  }));
  const canRun = !!employeeId && !!start && !!end && !loading;

  async function generate() {
    if (!employeeId || !start || !end) return;
    setLoading(true);
    try {
      const data = await utils.report.employee.fetch({
        employeeId,
        start: new Date(start),
        end: new Date(end),
      });
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<EmployeeRow>[] = [
    { header: "Ticket", cell: (r) => r.ticketNo, csv: (r) => r.ticketNo, mono: true },
    { header: "Company", cell: (r) => r.company, csv: (r) => r.company },
    { header: "Problem", cell: (r) => r.problemType, csv: (r) => r.problemType },
    {
      header: "Start",
      cell: (r) => formatDate(r.startDate),
      csv: (r) => formatDate(r.startDate),
    },
    {
      header: "Closure",
      cell: (r) => formatDate(r.expClosure),
      csv: (r) => formatDate(r.expClosure),
    },
    {
      header: "Registered By",
      cell: (r) => r.registeredBy,
      csv: (r) => r.registeredBy,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee report</CardTitle>
        <CardDescription>
          Completed calls handled by an employee over a date range.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="employee-select">Employee</Label>
            <Combobox
              id="employee-select"
              options={userOptions}
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="Select employee…"
              disabled={users.isLoading}
            />
          </div>
          <DateRangeFields
            start={start}
            end={end}
            onStart={setStart}
            onEnd={setEnd}
            idPrefix="employee"
          />
          <Button onClick={generate} disabled={!canRun}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Generate
          </Button>
        </div>
        <ReportResults
          rows={rows}
          columns={columns}
          filename="employee-report"
          hasRun={rows !== null}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}

function CompanyTab() {
  const utils = trpc.useUtils();
  const companies = trpc.company.options.useQuery();
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [rows, setRows] = React.useState<CompanyRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const companyOptions = (companies.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const canRun = !!companyId && !!start && !!end && !loading;

  async function generate() {
    if (!companyId || !start || !end) return;
    setLoading(true);
    try {
      const data = await utils.report.company.fetch({
        companyId,
        start: new Date(start),
        end: new Date(end),
      });
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<CompanyRow>[] = [
    { header: "Ticket", cell: (r) => r.ticketNo, csv: (r) => r.ticketNo, mono: true },
    { header: "Problem", cell: (r) => r.problemType, csv: (r) => r.problemType },
    {
      header: "Start",
      cell: (r) => formatDate(r.startDate),
      csv: (r) => formatDate(r.startDate),
    },
    {
      header: "End",
      cell: (r) => formatDate(r.endDate),
      csv: (r) => formatDate(r.endDate),
    },
    {
      header: "Assigned",
      cell: (r) => r.assignedEmployee,
      csv: (r) => r.assignedEmployee,
    },
    {
      header: "Registered By",
      cell: (r) => r.registeredBy,
      csv: (r) => r.registeredBy,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company report</CardTitle>
        <CardDescription>
          Service history for a customer over a date range.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="company-select">Company</Label>
            <Combobox
              id="company-select"
              options={companyOptions}
              value={companyId}
              onChange={setCompanyId}
              placeholder="Select company…"
              disabled={companies.isLoading}
            />
          </div>
          <DateRangeFields
            start={start}
            end={end}
            onStart={setStart}
            onEnd={setEnd}
            idPrefix="company"
          />
          <Button onClick={generate} disabled={!canRun}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Generate
          </Button>
        </div>
        <ReportResults
          rows={rows}
          columns={columns}
          filename="company-report"
          hasRun={rows !== null}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}

function FiscalTab() {
  const utils = trpc.useUtils();
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [rows, setRows] = React.useState<FiscalRow[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const canRun = !!start && !!end && !loading;

  async function generate() {
    if (!start || !end) return;
    setLoading(true);
    try {
      const data = await utils.report.fiscal.fetch({
        start: new Date(start),
        end: new Date(end),
      });
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<FiscalRow>[] = [
    { header: "Ticket", cell: (r) => r.ticketNo, csv: (r) => r.ticketNo, mono: true },
    { header: "Company", cell: (r) => r.company, csv: (r) => r.company },
    {
      header: "Initial Employee",
      cell: (r) => r.initialEmployee,
      csv: (r) => r.initialEmployee,
    },
    {
      header: "Engineers",
      cell: (r) => r.engineers || "—",
      csv: (r) => r.engineers,
    },
    { header: "Call Type", cell: (r) => r.callType, csv: (r) => r.callType },
    {
      header: "Date",
      cell: (r) => formatDate(r.startDate),
      csv: (r) => formatDate(r.startDate),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fiscal report</CardTitle>
        <CardDescription>
          Engineers and call types across a date range, for accounting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DateRangeFields
            start={start}
            end={end}
            onStart={setStart}
            onEnd={setEnd}
            idPrefix="fiscal"
          />
          <Button onClick={generate} disabled={!canRun}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Generate
          </Button>
        </div>
        <ReportResults
          rows={rows}
          columns={columns}
          filename="fiscal-report"
          hasRun={rows !== null}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}

export function ReportsView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational reports with CSV export."
      />

      <Tabs defaultValue="employee" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employee">Employee</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>
        <TabsContent value="employee">
          <EmployeeTab />
        </TabsContent>
        <TabsContent value="company">
          <CompanyTab />
        </TabsContent>
        <TabsContent value="fiscal">
          <FiscalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

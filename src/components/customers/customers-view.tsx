"use client";

import * as React from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanyFormDialog } from "./company-form-dialog";

export function CustomersView() {
  const utils = trpc.useUtils();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => setPage(1), [debounced, pageSize]);

  const list = trpc.company.list.useQuery({
    page,
    pageSize,
    search: debounced,
  });

  const removeMut = trpc.company.remove.useMutation();
  const generateMut = trpc.company.generateAmcCalls.useMutation();

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
      toast.success("Customer deleted");
      await utils.company.list.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  async function generateAmcCalls() {
    try {
      const res = await generateMut.mutateAsync();
      toast.success(`Generated ${res.created} AMC calls`);
      await utils.company.list.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate AMC calls");
    }
  }

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Companies, contacts and AMC contracts."
      >
        <Button
          variant="outline"
          onClick={generateAmcCalls}
          disabled={generateMut.isPending}
        >
          {generateMut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CalendarPlus className="size-4" />
          )}
          Add AMC calls
        </Button>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          New customer
        </Button>
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search company or city…"
      />

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>AMC</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="No customers found"
                      description="Try adjusting your search, or add a new customer."
                      className="border-0"
                    >
                      <Button onClick={openNew} variant="outline">
                        <Plus className="size-4" />
                        New customer
                      </Button>
                    </EmptyState>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => {
                  const contacts = c.contactPerson ?? [];
                  const contactLabel =
                    contacts.length === 0
                      ? "—"
                      : contacts.length === 1
                        ? contacts[0]!.name
                        : `${contacts.length} contacts`;
                  const location = [c.city, c.state]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => openEdit(c.id)}
                    >
                      <TableCell className="max-w-[240px] truncate font-medium">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {location || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contactLabel}
                      </TableCell>
                      <TableCell>
                        {c.hasAmc ? (
                          <Badge>AMC</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openEdit(c.id)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <CompanyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editId}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this customer?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={removeMut.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

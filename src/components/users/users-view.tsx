"use client";

import * as React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { Plus, MoreHorizontal, Pencil, UserX, Users } from "lucide-react";
import { toast } from "sonner";

import type { AppRouter } from "@/server/routers/_app";
import { trpc } from "@/trpc/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate, formatPhone, initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ListToolbar } from "@/components/data/list-toolbar";
import { DataPagination } from "@/components/data/data-pagination";
import { ConfirmDialog } from "@/components/data/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { UserFormDialog } from "./user-form-dialog";

export type UserRow =
  inferRouterOutputs<AppRouter>["user"]["list"]["items"][number];

const COL_COUNT = 6;

export function UsersView({ currentUserId }: { currentUserId: string }) {
  const utils = trpc.useUtils();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const debounced = useDebouncedValue(search);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<UserRow | null>(null);
  const [disableUser, setDisableUser] = React.useState<UserRow | null>(null);

  React.useEffect(() => setPage(1), [debounced, pageSize]);

  const list = trpc.user.list.useQuery({ page, pageSize, search: debounced });
  const disableMut = trpc.user.disable.useMutation();

  function openNew() {
    setEditUser(null);
    setFormOpen(true);
  }
  function openEdit(u: UserRow) {
    setEditUser(u);
    setFormOpen(true);
  }

  async function confirmDisable() {
    if (!disableUser) return;
    try {
      await disableMut.mutateAsync({ id: disableUser.id });
      toast.success("User disabled");
      await utils.user.list.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disable user");
    } finally {
      setDisableUser(null);
    }
  }

  const items = list.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Team members, roles and access.">
        <Button onClick={openNew}>
          <Plus className="size-4" />
          New user
        </Button>
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or email…"
      />

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={COL_COUNT}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      description="Try a different search, or create a new team member."
                      className="border-0"
                    >
                      <Button onClick={openNew} variant="outline">
                        <Plus className="size-4" />
                        New user
                      </Button>
                    </EmptyState>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPhone(u.mobileNo)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(u)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          {u.id !== currentUserId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDisableUser(u)}
                              >
                                <UserX className="size-4" />
                                Disable user
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

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editId={editUser?.id ?? null}
        initial={editUser}
      />

      <ConfirmDialog
        open={!!disableUser}
        onOpenChange={(o) => !o && setDisableUser(null)}
        title="Disable this user?"
        description={
          disableUser
            ? `${disableUser.name} will lose access immediately. You can re-enable them later.`
            : undefined
        }
        confirmLabel="Disable user"
        destructive
        loading={disableMut.isPending}
        onConfirm={confirmDisable}
      />
    </div>
  );
}

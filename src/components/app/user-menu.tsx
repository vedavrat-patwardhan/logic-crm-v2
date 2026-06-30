"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, UserCircle, ChevronsUpDown } from "lucide-react";
import type { Role } from "@prisma/client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";

export type SessionUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
};

export function UserMenu({
  user,
  variant = "compact",
}: {
  user: SessionUser;
  variant?: "compact" | "full";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "full" ? (
          <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </button>
        ) : (
          <button
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {ROLE_LABELS[user.role]}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCircle className="size-4" />
            Profile &amp; password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

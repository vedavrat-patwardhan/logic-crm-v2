"use client";

import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "./command-palette";
import { UserMenu, type SessionUser } from "./user-menu";
import { flatNav } from "./nav-config";

function useTitle(role: Role) {
  const pathname = usePathname();
  const match = flatNav(role)
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.title ?? "Workspace";
}

export function AppTopbar({ user }: { user: SessionUser }) {
  const title = useTitle(user.role);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 hidden h-6 sm:block" />
      <h1 className="text-base font-semibold tracking-tight sm:text-lg">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden sm:block">
          <CommandPalette role={user.role} />
        </div>
        <ThemeToggle />
        <UserMenu user={user} variant="compact" />
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/logo";
import { visibleSections } from "./nav-config";
import { UserMenu, type SessionUser } from "./user-menu";

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const sections = visibleSections(user.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/calls"
          className="flex items-center gap-2.5 px-1 py-1.5 group-data-[collapsible=icon]:justify-center"
        >
          <Logo
            showText
            className="group-data-[collapsible=icon]:[&_div:last-child]:hidden"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:hidden">
          <UserMenu user={user} variant="full" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

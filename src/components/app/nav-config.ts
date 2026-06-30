import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  PhoneCall,
  TrendingUp,
  Building2,
  ClipboardList,
  FileBarChart,
  Users,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: Role[]; // roles allowed to see the item
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

const ALL: Role[] = ["ADMIN", "SALES_ADMIN", "USER"];
const ELEVATED: Role[] = ["ADMIN", "SALES_ADMIN"];
const ADMIN: Role[] = ["ADMIN"];

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operations",
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: LayoutDashboard,
        roles: ELEVATED,
      },
      { title: "Calls", href: "/calls", icon: PhoneCall, roles: ALL },
      { title: "Sales", href: "/sales", icon: TrendingUp, roles: ELEVATED },
      {
        title: "Job Cards",
        href: "/job-cards",
        icon: ClipboardList,
        roles: ALL,
      },
    ],
  },
  {
    label: "Records",
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: Building2,
        roles: ELEVATED,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        roles: ELEVATED,
      },
      { title: "Users", href: "/users", icon: Users, roles: ADMIN },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", href: "/profile", icon: UserCircle, roles: ALL },
    ],
  },
];

export function visibleSections(role: Role): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);
}

export function flatNav(role: Role): NavItem[] {
  return visibleSections(role).flatMap((s) => s.items);
}

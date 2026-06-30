import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import type { SessionUser } from "@/components/app/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user: SessionUser = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppTopbar user={user} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

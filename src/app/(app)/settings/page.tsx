import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/unauthorized");
  return <SettingsView />;
}

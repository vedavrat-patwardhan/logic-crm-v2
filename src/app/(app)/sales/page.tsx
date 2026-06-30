import type { Metadata } from "next";
import { auth } from "@/auth";
import { CallsView } from "@/components/calls/calls-view";

export const metadata: Metadata = { title: "Sales" };

export default async function SalesPage() {
  const session = await auth();
  return (
    <CallsView
      kind="sales"
      role={session!.user.role}
      userId={session!.user.id}
    />
  );
}

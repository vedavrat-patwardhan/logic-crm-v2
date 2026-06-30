import type { Metadata } from "next";
import { auth } from "@/auth";
import { CallsView } from "@/components/calls/calls-view";

export const metadata: Metadata = { title: "Calls" };

export default async function CallsPage() {
  const session = await auth();
  return (
    <CallsView
      kind="service"
      role={session!.user.role}
      userId={session!.user.id}
    />
  );
}

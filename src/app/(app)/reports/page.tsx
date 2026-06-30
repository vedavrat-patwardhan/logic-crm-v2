import type { Metadata } from "next";
import { auth } from "@/auth";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await auth();
  return <ReportsView />;
}

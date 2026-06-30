import type { Metadata } from "next";
import { auth } from "@/auth";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await auth();
  return <AnalyticsView />;
}

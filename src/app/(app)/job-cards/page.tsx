import type { Metadata } from "next";
import { auth } from "@/auth";
import { JobCardsView } from "@/components/jobcards/jobcards-view";

export const metadata: Metadata = { title: "Job Cards" };

export default async function JobCardsPage() {
  await auth();
  return <JobCardsView />;
}

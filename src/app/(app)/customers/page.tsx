import type { Metadata } from "next";
import { auth } from "@/auth";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  await auth();
  return <CustomersView />;
}

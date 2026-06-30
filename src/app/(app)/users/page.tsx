import type { Metadata } from "next";
import { auth } from "@/auth";
import { UsersView } from "@/components/users/users-view";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await auth();
  return <UsersView currentUserId={session!.user.id} />;
}

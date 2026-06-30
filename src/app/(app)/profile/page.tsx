import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  const u = session!.user;
  return <ProfileView name={u.name ?? ""} email={u.email ?? ""} role={u.role} />;
}

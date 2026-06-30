import { redirect } from "next/navigation";

// `proxy.ts` normally handles "/", this is a safety net.
export default function RootPage() {
  redirect("/login");
}

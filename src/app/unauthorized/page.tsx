import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. If you think this is
          a mistake, contact your administrator.
        </p>
        <Button asChild className="mt-6">
          <Link href="/calls">Back to workspace</Link>
        </Button>
      </div>
    </div>
  );
}

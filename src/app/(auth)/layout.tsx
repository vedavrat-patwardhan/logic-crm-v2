import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel (desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />
        <div className="absolute -right-24 -top-24 size-[420px] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-[420px] rounded-full bg-sky-700/20 blur-3xl" />

        <Link href="/" className="relative z-10 w-fit">
          <Logo />
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight">
            Run your entire service operation from one place.
          </h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-sidebar-foreground/70">
            Calls, customers, AMC scheduling, job cards, sales pipeline and
            analytics — unified, fast, and built for teams.
          </p>
        </div>

        <p className="relative z-10 text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Logic Systems. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

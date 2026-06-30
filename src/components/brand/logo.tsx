import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 4v13a3 3 0 0 0 3 3h13"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 14l3.2-3.6 2.6 2.4L19 7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText ? (
        <div className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight">
            Logic CRM
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Service Operations
          </span>
        </div>
      ) : null}
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-border",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={720}
        height={420}
        priority
        className="w-6 object-contain"
      />
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
            Logic Systems
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            CRM · Service Operations
          </span>
        </div>
      ) : null}
    </div>
  );
}

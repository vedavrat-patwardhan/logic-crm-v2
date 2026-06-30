"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster richColors closeButton position="top-right" />
      </TRPCReactProvider>
    </ThemeProvider>
  );
}

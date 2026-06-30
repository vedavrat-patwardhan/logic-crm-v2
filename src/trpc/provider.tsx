"use client";

import { useState } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./react";
import { makeQueryClient } from "./query-client";

let clientSingleton: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  return (clientSingleton ??= makeQueryClient());
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            op.direction === "down" && op.result instanceof Error,
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`tRPC error on ${path ?? "<no-path>"}:`, error.message);
      }
    },
  });

export { handler as GET, handler as POST };

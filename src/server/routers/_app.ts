import { router } from "../trpc";
import { systemRouter } from "./system";
import { userRouter } from "./user";
import { companyRouter } from "./company";
import { callRouter } from "./call";
import { jobcardRouter } from "./jobcard";
import { reportRouter } from "./report";
import { analyticsRouter } from "./analytics";

export const appRouter = router({
  system: systemRouter,
  user: userRouter,
  company: companyRouter,
  calls: callRouter,
  jobcard: jobcardRouter,
  report: reportRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

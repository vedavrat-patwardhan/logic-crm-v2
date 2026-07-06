import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDueAmcCalls } from "@/server/lib/amc";

// Prisma needs the Node.js runtime; never cache this route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await generateDueAmcCalls(prisma);
  return NextResponse.json({ ok: true, ...result });
}

// POST is the primary trigger; GET is allowed so simple cron services that
// only issue GET requests can call it too (still gated by the bearer secret).
export const POST = run;
export const GET = run;

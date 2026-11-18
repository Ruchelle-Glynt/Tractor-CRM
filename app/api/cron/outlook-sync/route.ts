import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncConnection } from "@/lib/outlook";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// GET /api/cron/outlook-sync - run nightly by Vercel Cron (see vercel.json).
// Vercel sends "Authorization: Bearer <CRON_SECRET>"; anything else is refused.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.outlookConnection.findMany({
    where: { user: { active: true } },
    select: { id: true, msEmail: true },
    orderBy: { lastSyncAt: { sort: "asc", nulls: "first" } },
  });
  const started = Date.now();
  const results: { mailbox: string; logged?: number; error?: string }[] = [];
  for (const c of connections) {
    if (Date.now() - started > 50_000) break; // stay inside the time limit; the rest go first next night
    try {
      const r = await syncConnection(c.id);
      results.push({ mailbox: c.msEmail, logged: r.logged });
    } catch (err) {
      results.push({ mailbox: c.msEmail, error: err instanceof Error ? err.message : "failed" });
    }
  }
  return NextResponse.json({ synced: results.length, of: connections.length, results });
}

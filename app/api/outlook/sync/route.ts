import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { syncConnection } from "@/lib/outlook";

export const maxDuration = 60;

// POST /api/outlook/sync - "Sync now" for your own Outlook.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const conn = await prisma.outlookConnection.findUnique({ where: { userId: user.id } });
  if (!conn) return NextResponse.json({ error: "Outlook isn't connected." }, { status: 400 });
  try {
    return NextResponse.json(await syncConnection(conn.id));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed." }, { status: 502 });
  }
}

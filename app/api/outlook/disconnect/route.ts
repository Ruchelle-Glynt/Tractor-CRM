import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

// POST /api/outlook/disconnect - stop syncing your Outlook. Activities already
// logged stay in the CRM.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await prisma.outlookConnection.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canEditAccount, NO_PERMISSION } from "@/lib/permissions";

// DELETE /api/spend/:id - remove a month's spend figure entered by mistake.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const metric = await prisma.accountGrowthMetric.findUnique({
    where: { id: params.id },
    include: { account: { select: { salesExecutiveId: true } } },
  });
  if (!metric) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditAccount(user, metric.account)) return NextResponse.json({ error: NO_PERMISSION }, { status: 403 });

  await prisma.accountGrowthMetric.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

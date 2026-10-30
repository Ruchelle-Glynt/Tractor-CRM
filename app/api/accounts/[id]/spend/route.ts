import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canEditAccount, NO_PERMISSION } from "@/lib/permissions";

// POST /api/accounts/:id/spend - record (or correct) one month's spend and
// holding size for an account (spec 4.5, Priority 7). Channel is left blank
// in phase 1, so there's one figure per account per month.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const account = await prisma.account.findUnique({ where: { id: params.id }, select: { salesExecutiveId: true } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (!canEditAccount(user, account)) return NextResponse.json({ error: NO_PERMISSION }, { status: 403 });

  const body = await request.json();
  const m = /^(\d{4})-(\d{2})$/.exec(String(body.period ?? ""));
  if (!m) return NextResponse.json({ error: "Choose a month." }, { status: 400 });
  const period = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));

  const toNumber = (v: unknown) => (v === undefined || v === null || String(v).trim() === "" ? null : Number(String(v).replace(/[R\s,]/gi, "")));
  const spendAmount = toNumber(body.spendAmount);
  const holdingSize = toNumber(body.holdingSize);
  if (spendAmount === null || isNaN(spendAmount) || spendAmount < 0) {
    return NextResponse.json({ error: "Spend must be a number, e.g. 250000." }, { status: 400 });
  }
  if (holdingSize !== null && (isNaN(holdingSize) || holdingSize < 0)) {
    return NextResponse.json({ error: "Holding size must be a number." }, { status: 400 });
  }

  // Postgres treats blank channels as distinct, so look the month up by hand
  // rather than relying on the unique index.
  const existing = await prisma.accountGrowthMetric.findFirst({
    where: { accountId: params.id, period, channelType: null },
  });
  const metric = existing
    ? await prisma.accountGrowthMetric.update({ where: { id: existing.id }, data: { spendAmount, holdingSize } })
    : await prisma.accountGrowthMetric.create({ data: { accountId: params.id, period, spendAmount, holdingSize } });

  return NextResponse.json(
    {
      id: metric.id,
      period: metric.period.toISOString(),
      spendAmount: Number(metric.spendAmount),
      holdingSize: metric.holdingSize === null ? null : Number(metric.holdingSize),
    },
    { status: existing ? 200 : 201 }
  );
}

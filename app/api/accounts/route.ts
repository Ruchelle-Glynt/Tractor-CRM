import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/accounts - list all accounts (basic fields only, for the list page)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    include: { category: true, salesExecutive: true, mainContact: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(accounts);
}

// POST /api/accounts - create a new Account
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const required = ["name", "type", "tier", "categoryId", "fiscalYearStart", "salesExecutiveId"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const account = await prisma.account.create({
    data: {
      name: body.name,
      type: body.type,
      tier: body.tier,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId || null,
      fiscalYearStart: body.fiscalYearStart,
      salesExecutiveId: body.salesExecutiveId,
      parentAgencyId: body.parentAgencyId || null,
    },
  });

  return NextResponse.json(account, { status: 201 });
}

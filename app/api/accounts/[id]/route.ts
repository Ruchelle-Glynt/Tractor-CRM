import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/accounts/:id - full account detail: team roster, contracts, etc.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      subcategory: true,
      salesExecutive: true,
      mainContact: true,
      parentAgency: true,
      clients: true,
      contacts: { orderBy: { firstName: "asc" } }, // full team roster
      contracts: { orderBy: { endDate: "asc" } },
      growthMetrics: { orderBy: { period: "desc" }, take: 12 },
    },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

// PATCH /api/accounts/:id - partial update (e.g. setting mainContactId once a
// contact exists, per spec Section 4.2)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const account = await prisma.account.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(account);
}

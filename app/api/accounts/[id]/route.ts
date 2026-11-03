import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canEditAccount, NO_PERMISSION } from "@/lib/permissions";

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

// PATCH /api/accounts/:id - partial update (edit screen, and setting
// mainContactId once a contact exists, per spec Section 4.2)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  const existing = await prisma.account.findUnique({ where: { id: params.id }, select: { salesExecutiveId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditAccount(user, existing)) return NextResponse.json({ error: NO_PERMISSION }, { status: 403 });

  const body = await request.json();

  // Agencies never carry a category - enforce this on every update, not just
  // on create, so flipping a Client to an Agency clears any stale category.
  if (body.type === "AGENCY") {
    body.categoryId = null;
    body.subcategoryId = null;
  }

  const account = await prisma.account.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(account);
}

// DELETE /api/accounts/:id - Admins only. Removes the account with its
// contacts, activity, contracts and spend history. Clients that went through
// it (if it's an agency) and linked leads are kept, just unlinked.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only Admins can delete accounts." }, { status: 403 });

  const existing = await prisma.account.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.account.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

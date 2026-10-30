import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canEditLead, NO_PERMISSION } from "@/lib/permissions";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      linkedAccount: { select: { id: true, name: true } },
      transferredToUser: { select: { id: true, name: true } },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await prisma.lead.findUnique({ where: { id: params.id }, select: { transferredToUserId: true } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!canEditLead(await getCurrentUser(), existing)) {
    return NextResponse.json({ error: NO_PERMISSION }, { status: 403 });
  }

  const body = await request.json();
  const { status, linkedAccountId, convertedValue, convertedAt } = body;

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(linkedAccountId !== undefined && { linkedAccountId: linkedAccountId || null }),
      ...(convertedValue !== undefined && { convertedValue: convertedValue ? Number(convertedValue) : null }),
      ...(convertedAt !== undefined && { convertedAt: convertedAt ? new Date(convertedAt) : null }),
    },
  });

  return NextResponse.json(lead);
}

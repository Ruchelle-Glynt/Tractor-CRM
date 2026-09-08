import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    include: {
      linkedAccount: { select: { id: true, name: true } },
      transferredToUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const {
    source,
    contactName,
    contactEmail,
    contactPhone,
    companyName,
    linkedAccountId,
    transferredToUserId,
  } = body;

  if (!source || !contactName || !transferredToUserId) {
    return NextResponse.json(
      { error: "source, contactName, and transferredToUserId are required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      source,
      contactName,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      companyName: companyName || null,
      linkedAccountId: linkedAccountId || null,
      transferredToUserId,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}

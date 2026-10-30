import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canEditAccount, NO_PERMISSION } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: { account: true, activities: true, triggerLogs: true },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getCurrentUser();
  const existing = await prisma.contact.findUnique({
    where: { id: params.id },
    select: { account: { select: { salesExecutiveId: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditAccount(user, existing.account)) return NextResponse.json({ error: NO_PERMISSION }, { status: 403 });

  const body = await request.json();
  // Moving a contact to another account needs edit rights on that account too.
  if (body.accountId) {
    const target = await prisma.account.findUnique({ where: { id: body.accountId }, select: { salesExecutiveId: true } });
    if (!target || !canEditAccount(user, target)) return NextResponse.json({ error: NO_PERMISSION }, { status: 403 });
  }
  if (body.birthday) body.birthday = new Date(body.birthday);

  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(contact);
}

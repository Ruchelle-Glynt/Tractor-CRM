import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_TYPES } from "@/lib/activity";

// POST /api/accounts/:id/activities - log a gift, event, call, meeting etc.
// against this account. The person logging it is recorded as the owner.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json();

  if (!ACTIVITY_TYPES.some((t) => t.value === body.type)) {
    return NextResponse.json({ error: "Choose an activity type." }, { status: 400 });
  }
  const activityDate = body.activityDate ? new Date(body.activityDate) : null;
  if (!activityDate || isNaN(activityDate.getTime())) {
    return NextResponse.json({ error: "Choose a date." }, { status: 400 });
  }

  let value: number | null = null;
  if (body.value !== undefined && body.value !== null && String(body.value).trim() !== "") {
    value = Number(String(body.value).replace(/[R\s,]/gi, ""));
    if (isNaN(value) || value < 0) {
      return NextResponse.json({ error: "Value must be a number, e.g. 2500." }, { status: 400 });
    }
  }

  // A contact, if chosen, must belong to this account.
  let contactId: string | null = body.contactId || null;
  if (contactId) {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, accountId: params.id } });
    if (!contact) contactId = null;
  }

  const account = await prisma.account.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const activity = await prisma.activity.create({
    data: {
      accountId: params.id,
      contactId,
      type: body.type,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      activityDate,
      ownerId: userId,
      value,
    },
    include: { owner: { select: { name: true } }, contact: { select: { id: true, firstName: true, lastName: true } } },
  });

  return NextResponse.json({ ...activity, value: activity.value === null ? null : Number(activity.value) }, { status: 201 });
}

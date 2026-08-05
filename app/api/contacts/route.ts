import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/contacts - list all contacts with their account name
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    include: { account: true },
    orderBy: { firstName: "asc" },
  });
  return NextResponse.json(contacts);
}

// POST /api/contacts - create a new Contact under an Account
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const required = ["accountId", "firstName", "lastName"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const contact = await prisma.contact.create({
    data: {
      accountId: body.accountId,
      firstName: body.firstName,
      lastName: body.lastName,
      title: body.title || null,
      decisionRole: body.decisionRole || null,
      email: body.email || null,
      phone: body.phone || null,
      birthday: body.birthday ? new Date(body.birthday) : null,
      interests: body.interests || [],
      familyPetNotes: body.familyPetNotes || null,
      personalityNotes: body.personalityNotes || null,
      giftPreferences: body.giftPreferences || null,
      giftRestrictions: body.giftRestrictions || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}

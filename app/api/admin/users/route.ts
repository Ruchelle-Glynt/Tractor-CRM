import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { tempPassword } from "@/lib/passwords";
import { OFFICES } from "@/lib/importPlan";

const ROLES = ["ADMIN", "SALES", "MARKETING"] as const;

// POST /api/admin/users - Admins add a new user. Returns a temporary password
// to pass on; it's shown once and never stored in readable form.
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Only Admins can add users." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = ROLES.includes(body.role) ? body.role : "SALES";
  if (!name) return NextResponse.json({ error: "Enter their name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })) {
    return NextResponse.json({ error: "Someone already uses that email address." }, { status: 400 });
  }

  const password = tempPassword();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      office: (OFFICES as readonly string[]).includes(body.office) ? body.office : null,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
      passwordHash: await bcrypt.hash(password, 10),
    },
    select: { id: true, name: true, email: true },
  });
  return NextResponse.json({ ...user, password }, { status: 201 });
}

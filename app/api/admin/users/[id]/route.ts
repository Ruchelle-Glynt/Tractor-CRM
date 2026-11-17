import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { OFFICES } from "@/lib/importPlan";

const ROLES = ["ADMIN", "SALES", "MARKETING"];

// PATCH /api/admin/users/:id - Admins change someone's role, office, title,
// email or active status. You can't demote or deactivate yourself.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Only Admins can change users." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const self = params.id === me.id;
  const data: Record<string, unknown> = {};

  if ("role" in body) {
    if (!ROLES.includes(body.role)) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    if (self && body.role !== "ADMIN") return NextResponse.json({ error: "You can't remove your own Admin rights." }, { status: 400 });
    data.role = body.role;
  }
  if ("active" in body) {
    if (self && !body.active) return NextResponse.json({ error: "You can't deactivate yourself." }, { status: 400 });
    data.active = Boolean(body.active);
  }
  if ("office" in body) data.office = OFFICES.includes(body.office) ? body.office : null;
  if ("title" in body) data.title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : null;
  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Name can't be empty." }, { status: 400 });
    data.name = body.name.trim().slice(0, 80);
  }
  if ("email" in body) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const clash = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, NOT: { id: params.id } } });
    if (clash) return NextResponse.json({ error: "Someone else already uses that email." }, { status: 400 });
    data.email = email;
  }

  const user = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, role: true, active: true, office: true } });
  return NextResponse.json(user);
}

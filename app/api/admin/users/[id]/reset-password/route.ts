import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { tempPassword } from "@/lib/passwords";

// POST /api/admin/users/:id/reset-password - give someone a new temporary
// password (shown once to the Admin), e.g. when they've forgotten theirs.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Only Admins can reset passwords." }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, name: true, email: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const password = tempPassword();
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return NextResponse.json({ name: user.name, email: user.email, password });
}

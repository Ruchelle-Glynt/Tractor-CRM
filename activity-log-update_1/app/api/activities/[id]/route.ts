import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/activities/:id - remove an activity logged by mistake.
// Only the person who logged it, or an Admin, can delete it.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const activity = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

  if (activity.ownerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the person who logged this, or an Admin, can delete it." }, { status: 403 });
  }

  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

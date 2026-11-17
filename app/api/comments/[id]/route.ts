import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

// DELETE /api/comments/:id - the person who wrote it, or an Admin.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (comment.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the person who wrote this, or an Admin, can delete it." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

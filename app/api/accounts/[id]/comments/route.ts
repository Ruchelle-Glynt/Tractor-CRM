import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

// POST /api/accounts/:id/comments - add a note to an account's comment log,
// e.g. a holding expiring or an iconic site booking coming to an end.
// Anyone signed in can comment on any account.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Write a comment first." }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "That comment is too long (5 000 characters max)." }, { status: 400 });

  const account = await prisma.account.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { accountId: params.id, authorId: user.id, body: text },
    include: { author: { select: { name: true } } },
  });
  return NextResponse.json(
    { id: comment.id, body: comment.body, createdAt: comment.createdAt.toISOString(), authorId: comment.authorId, author: comment.author },
    { status: 201 }
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

// POST /api/accounts/bulk-delete { ids: string[] } - Admins only. Same as
// deleting each account one by one (contacts, activity and spend go with it).
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only Admins can delete accounts." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "No accounts selected." }, { status: 400 });

  const res = await prisma.account.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: res.count });
}

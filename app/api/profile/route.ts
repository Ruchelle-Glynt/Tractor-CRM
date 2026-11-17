import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { OFFICES } from "@/lib/importPlan";
import { isValidPhotoDataUrl } from "@/lib/photo";

// PATCH /api/profile - update your own name, job title, phone, office and photo.
// Send photo: null to remove it.
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

  if ("name" in body) {
    const name = text(body.name, 80);
    if (!name) return NextResponse.json({ error: "Your name can't be empty." }, { status: 400 });
    data.name = name;
  }
  if ("title" in body) data.title = text(body.title, 80);
  if ("phone" in body) data.phone = text(body.phone, 30);
  if ("office" in body) data.office = (OFFICES as readonly string[]).includes(body.office) ? body.office : null;
  if ("photo" in body) {
    if (body.photo === null) {
      data.photo = null;
      data.photoUpdatedAt = null;
    } else if (isValidPhotoDataUrl(body.photo)) {
      data.photo = body.photo;
      data.photoUpdatedAt = new Date();
    } else {
      return NextResponse.json({ error: "That photo couldn't be used - try a JPG or PNG." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, title: true, phone: true, office: true, photoUpdatedAt: true },
  });
  return NextResponse.json(updated);
}

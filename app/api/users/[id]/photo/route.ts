import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";

// GET /api/users/:id/photo - a user's profile photo, for signed-in users.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await getCurrentUser())) return new NextResponse(null, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { photo: true } });
  const m = user?.photo?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: {
      "Content-Type": m[1],
      // the URL changes when the photo does (?v=...), so it can be cached hard
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

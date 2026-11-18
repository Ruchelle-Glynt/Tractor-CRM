import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/permissions";
import { authorizeUrl, outlookConfigured } from "@/lib/outlook";

// GET /api/outlook/connect - sends you to Microsoft to allow the CRM to read
// your calendar and mail. Microsoft sends you back to /api/outlook/callback.
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!(await getCurrentUser())) return NextResponse.redirect(`${origin}/login`);
  if (!outlookConfigured()) return NextResponse.redirect(`${origin}/profile?outlook=not-set-up`);

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(origin, state));
  res.cookies.set("outlook_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}

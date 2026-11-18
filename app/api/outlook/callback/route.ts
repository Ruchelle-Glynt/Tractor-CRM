import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { encrypt, exchangeCode, getProfile, syncConnection } from "@/lib/outlook";

export const maxDuration = 60;

// GET /api/outlook/callback - Microsoft returns here after you allow access.
// Saves the connection (refresh token encrypted) and runs a first sync.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const back = (status: string, msg?: string) =>
    NextResponse.redirect(`${origin}/profile?outlook=${status}${msg ? `&msg=${encodeURIComponent(msg)}` : ""}`);

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const error = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (error) return back("error", error.split("\n")[0].slice(0, 200));

  const state = url.searchParams.get("state");
  if (!state || state !== cookies().get("outlook_state")?.value) return back("error", "The sign-in expired - please try again.");
  const code = url.searchParams.get("code");
  if (!code) return back("error", "Microsoft didn't send a sign-in code.");

  try {
    const tokens = await exchangeCode(code, origin);
    if (!tokens.refresh_token) return back("error", "Microsoft didn't allow ongoing access - ask IT to check the app permissions.");
    const profile = await getProfile(tokens.access_token);
    const msEmail = (profile.mail || profile.userPrincipalName).toLowerCase();

    const conn = await prisma.outlookConnection.upsert({
      where: { userId: user.id },
      create: { userId: user.id, msEmail, refreshToken: encrypt(tokens.refresh_token) },
      update: { msEmail, refreshToken: encrypt(tokens.refresh_token), lastError: null },
    });

    // First sync straight away (last 30 days); failures show on the Profile page
    try {
      const r = await syncConnection(conn.id);
      return back("connected", `${r.logged}`);
    } catch {
      return back("connected");
    }
  } catch (err) {
    return back("error", err instanceof Error ? err.message.slice(0, 200) : "Couldn't connect Outlook.");
  }
}

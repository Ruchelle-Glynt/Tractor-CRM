export { default } from "next-auth/middleware";

// Protect every route except the login page, NextAuth's own API, the nightly
// Outlook sync (which checks its own secret) and static assets. Anyone not
// signed in gets redirected to /login.
export const config = {
  matcher: ["/((?!login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};

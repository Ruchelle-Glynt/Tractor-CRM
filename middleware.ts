export { default } from "next-auth/middleware";

// Protect every route except the login page, NextAuth's own API, and static
// assets. Anyone not signed in gets redirected to /login.
export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};

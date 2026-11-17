import { randomBytes } from "crypto";

// Temporary password an Admin gives to a new user or after a reset,
// e.g. "Tractor-7f3a9c21". The person changes it on their Profile page.
export function tempPassword() {
  return `Tractor-${randomBytes(4).toString("hex")}`;
}

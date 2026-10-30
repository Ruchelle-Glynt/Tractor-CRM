// Who can change what (spec Section 6, simplified).
//
// - Admin and Marketing: can view and edit everything.
// - Sales: can VIEW everything (so they can still look up agencies and other
//   reps' clients), but can only EDIT accounts where they are the Sales
//   Executive, the contacts on those accounts, and leads transferred to them.
//
// Anyone signed in can still log an activity on any account, and add a new
// account or lead.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CurrentUser = { id: string; name: string; role: "ADMIN" | "SALES" | "MARKETING" };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as { id?: string; name?: string | null; role?: string } | undefined;
  if (!u?.id) return null;
  return { id: u.id, name: u.name ?? "", role: (u.role as CurrentUser["role"]) ?? "SALES" };
}

export function canEditAll(user: CurrentUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "MARKETING";
}

export function canEditAccount(user: CurrentUser | null, account: { salesExecutiveId: string }): boolean {
  if (!user) return false;
  return canEditAll(user) || account.salesExecutiveId === user.id;
}

export function canEditLead(user: CurrentUser | null, lead: { transferredToUserId: string }): boolean {
  if (!user) return false;
  return canEditAll(user) || lead.transferredToUserId === user.id;
}

export const NO_PERMISSION =
  "You can only change accounts, contacts and leads assigned to you. Ask an Admin if this needs updating.";

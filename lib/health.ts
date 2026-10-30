// "Going cold" - how long since anything was logged against an account.
import { prisma } from "@/lib/prisma";

export const COOLING_DAYS = 60;
export const COLD_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Health = {
  status: "ACTIVE" | "COOLING" | "COLD" | "NONE";
  lastActivity: Date | null;
  daysSince: number | null;
};

export function healthFor(lastActivity: Date | null | undefined): Health {
  if (!lastActivity) return { status: "NONE", lastActivity: null, daysSince: null };
  const daysSince = Math.max(0, Math.floor((Date.now() - lastActivity.getTime()) / DAY_MS));
  const status = daysSince >= COLD_DAYS ? "COLD" : daysSince >= COOLING_DAYS ? "COOLING" : "ACTIVE";
  return { status, lastActivity, daysSince };
}

// Most recent activity date per account, in one query.
export async function lastActivityByAccount(accountIds?: string[]): Promise<Map<string, Date>> {
  const rows = await prisma.activity.groupBy({
    by: ["accountId"],
    where: accountIds ? { accountId: { in: accountIds } } : undefined,
    _max: { activityDate: true },
  });
  return new Map(rows.filter((r) => r._max.activityDate).map((r) => [r.accountId, r._max.activityDate as Date]));
}

export const HEALTH_STYLE: Record<Health["status"], { bg: string; text: string }> = {
  ACTIVE: { bg: "#D1FAE5", text: "#065F46" },
  COOLING: { bg: "#FEF3C7", text: "#92400E" },
  COLD: { bg: "#FFE4EC", text: "#BE0044" },
  NONE: { bg: "#F3F4F6", text: "#6B7280" },
};

export function healthLabel(h: Health): string {
  if (h.status === "NONE") return "No activity yet";
  if (h.daysSince === 0) return "Active today";
  const ago = h.daysSince === 1 ? "1 day ago" : `${h.daysSince} days ago`;
  if (h.status === "COLD") return `Cold · ${ago}`;
  if (h.status === "COOLING") return `Cooling · ${ago}`;
  return `Active · ${ago}`;
}

// Date helpers for the home dashboard. Vercel's servers run on UTC, but the
// team works in South African time, so "today" and "this month" are worked
// out in Africa/Johannesburg.

const TZ = "Africa/Johannesburg";
const DAY_MS = 24 * 60 * 60 * 1000;

// Today's calendar date in SA, as a UTC-midnight Date (easy to compare with
// birthdays, which are stored as UTC-midnight dates).
export function saToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00Z`);
}

export function saHour(): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date()));
}

// Start of the SA month containing `today` (offset by `monthsBack`), as a
// real instant - SA is UTC+2 with no daylight saving.
export function saMonthStart(today: Date, monthsBack = 0): Date {
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsBack, 1) - 2 * 60 * 60 * 1000);
}

export function greeting(): string {
  const h = saHour();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Next time this birthday comes round (today counts), and how many days away.
// The year stored with a birthday is ignored - only day and month matter.
export function nextBirthday(birthday: Date, today: Date): { date: Date; daysAway: number } {
  const m = birthday.getUTCMonth();
  const d = birthday.getUTCDate();
  let next = new Date(Date.UTC(today.getUTCFullYear(), m, d));
  if (next.getTime() < today.getTime()) next = new Date(Date.UTC(today.getUTCFullYear() + 1, m, d));
  return { date: next, daysAway: Math.round((next.getTime() - today.getTime()) / DAY_MS) };
}

// Fiscal years that have a fixed start month (Multiple / To Be Assigned don't).
export const FISCAL_START_MONTH: Record<string, { month: number; label: string }> = {
  JAN_DEC: { month: 0, label: "Jan–Dec" },
  MAR_FEB: { month: 2, label: "Mar–Feb" },
  JUN_MAY: { month: 5, label: "Jun–May" },
};

export function nextFiscalStart(monthIndex: number, today: Date): { date: Date; daysAway: number } {
  let next = new Date(Date.UTC(today.getUTCFullYear(), monthIndex, 1));
  if (next.getTime() < today.getTime()) next = new Date(Date.UTC(today.getUTCFullYear() + 1, monthIndex, 1));
  return { date: next, daysAway: Math.round((next.getTime() - today.getTime()) / DAY_MS) };
}

export function daysAgo(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
}

export function relativeDays(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function shortDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
}

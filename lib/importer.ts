// One-off import of the sales master report (Net3 by month, per sales rep),
// cleaned and grouped into agencies and clients - see lib/data/master-report.json.
// The Admin > Import page matches these to CRM accounts and users, and lets an
// Admin review everything before anything is written. The row logic lives in
// lib/importPlan.ts so the browser and the server share it.
import raw from "@/lib/data/master-report.json";
import type { ReportAccount } from "@/lib/importPlan";

type Raw = { source: string; months: string[]; reps: { name: string; total: number }[]; accounts: ReportAccount[] };
const data = raw as unknown as Raw;

export const REPORT_SOURCE = data.source;
export const REPORT_MONTHS = data.months; // "YYYY-MM"
export const REPORT_REPS = data.reps;
export const REPORT_ACCOUNTS = data.accounts;

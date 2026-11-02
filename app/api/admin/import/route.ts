import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { REPORT_ACCOUNTS, REPORT_MONTHS } from "@/lib/importer";
import { buildPlan, monthToDate, OFFICES, type Office } from "@/lib/importPlan";

// Bulk work can take a little while on the first run.
export const maxDuration = 60;

type Body = {
  reps: Record<string, string>; // rep name -> user id | "new" | ""
  offices?: Record<string, string>; // rep name -> office ("JHB", "CPT", ...)
  rows: { key: string; action: "create" | "match" | "skip"; accountId?: string; type?: "CLIENT" | "AGENCY" }[];
  options: { updateExec: boolean; linkAgencies: boolean; importSpend: boolean };
};

// POST /api/admin/import - apply the reviewed master report import.
// Admin only. Safe to run again: accounts are matched by id, spend is
// replaced month by month rather than added twice.
export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ error: "Only Admins can run the import." }, { status: 403 });

  const body = (await request.json()) as Body;
  // Same rows the review page showed (agencies split per office)
  const offices: Record<string, Office> = {};
  for (const [rep, o] of Object.entries(body.offices ?? {})) offices[rep] = (OFFICES as readonly string[]).includes(o) ? (o as Office) : "";
  const report = new Map(buildPlan(REPORT_ACCOUNTS, offices).map((a) => [a.key, a]));

  // ---- 1. Sales reps: create any new users ----
  const newUsers: { name: string; email: string; password: string }[] = [];
  const repToUser = new Map<string, string>();
  const existingEmails = new Set((await prisma.user.findMany({ select: { email: true } })).map((u) => u.email.toLowerCase()));
  for (const [rep, choice] of Object.entries(body.reps ?? {})) {
    if (!choice) continue;
    if (choice !== "new") {
      repToUser.set(rep, choice);
      continue;
    }
    const parts = rep.toLowerCase().replace(/[^a-z\s-]/g, "").split(/[\s-]+/).filter(Boolean);
    let email = `${parts[0]}@tractoroutdoor.com`;
    if (existingEmails.has(email)) email = `${parts[0]}.${parts[parts.length - 1]}@tractoroutdoor.com`;
    if (existingEmails.has(email)) email = `${parts.join(".")}.${randomBytes(2).toString("hex")}@tractoroutdoor.com`;
    existingEmails.add(email);
    const password = `Tractor-${randomBytes(4).toString("hex")}`;
    const user = await prisma.user.create({
      data: { name: rep, email, role: "SALES", passwordHash: await bcrypt.hash(password, 10) },
    });
    repToUser.set(rep, user.id);
    newUsers.push({ name: rep, email, password });
  }

  // ---- 2. Accounts: create new ones, collect matched ones ----
  const keyToAccount = new Map<string, string>();
  const toCreate: { key: string; data: { name: string; type: "CLIENT" | "AGENCY"; tier: "TO_BE_ASSIGNED"; fiscalYearStart: "TO_BE_ASSIGNED"; salesExecutiveId: string } }[] = [];
  const execUpdates = new Map<string, string[]>(); // userId -> account ids
  const existingAccounts = await prisma.account.findMany({ select: { id: true, name: true } });
  const existingIds = new Set(existingAccounts.map((a) => a.id));
  const existingByName = new Map(existingAccounts.map((a) => [a.name.trim().toLowerCase(), a.id]));
  let unassigned = 0;
  let matchedRows = 0;

  for (const row of body.rows ?? []) {
    const r = report.get(row.key);
    if (!r || row.action === "skip") continue;
    const execId = (r.rep && repToUser.get(r.rep)) || null;
    // "Create" for a name that already exists in the CRM is treated as a match.
    const sameName = row.action === "create" ? existingByName.get(r.name.trim().toLowerCase()) : undefined;
    const matchId = row.action === "match" && row.accountId && existingIds.has(row.accountId) ? row.accountId : sameName;
    if (matchId) {
      row.accountId = matchId;
      matchedRows++;
      keyToAccount.set(r.key, row.accountId);
      if (body.options?.updateExec && execId) {
        execUpdates.set(execId, [...(execUpdates.get(execId) ?? []), row.accountId]);
      }
    } else if (row.action === "create") {
      if (!execId) unassigned++;
      toCreate.push({
        key: r.key,
        data: {
          name: r.name,
          type: row.type === "AGENCY" || row.type === "CLIENT" ? row.type : r.type,
          tier: "TO_BE_ASSIGNED",
          fiscalYearStart: "TO_BE_ASSIGNED",
          // Every account needs a sales exec - fall back to the Admin running
          // the import, so it can be reassigned afterwards.
          salesExecutiveId: execId ?? admin.id,
        },
      });
    }
  }

  // Avoid creating two accounts with the same name in one run
  const seen = new Set<string>();
  const uniqueCreates = toCreate.filter((c) => {
    const k = c.data.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const created = uniqueCreates.length
    ? await prisma.account.createManyAndReturn({ data: uniqueCreates.map((c) => c.data), select: { id: true, name: true } })
    : [];
  const createdByName = new Map(created.map((c) => [c.name.toLowerCase(), c.id]));
  for (const c of toCreate) {
    const id = createdByName.get(c.data.name.toLowerCase());
    if (id) keyToAccount.set(c.key, id);
  }

  let execChanged = 0;
  for (const [userId, ids] of Array.from(execUpdates.entries())) {
    const res = await prisma.account.updateMany({ where: { id: { in: ids }, NOT: { salesExecutiveId: userId } }, data: { salesExecutiveId: userId } });
    execChanged += res.count;
  }

  // ---- 3. Link clients to their media agency (only where none is set yet) ----
  let linked = 0;
  if (body.options?.linkAgencies) {
    const agencyIds = new Set(
      (await prisma.account.findMany({ where: { type: "AGENCY", id: { in: Array.from(keyToAccount.values()) } }, select: { id: true } })).map((a) => a.id)
    );
    const byAgency = new Map<string, string[]>();
    for (const [key, accountId] of Array.from(keyToAccount.entries())) {
      const r = report.get(key);
      if (!r?.agencyKey || r.type !== "CLIENT") continue;
      const agencyAccountId = keyToAccount.get(r.agencyKey);
      if (!agencyAccountId || !agencyIds.has(agencyAccountId) || agencyAccountId === accountId) continue;
      byAgency.set(agencyAccountId, [...(byAgency.get(agencyAccountId) ?? []), accountId]);
    }
    for (const [agencyId, ids] of Array.from(byAgency.entries())) {
      const res = await prisma.account.updateMany({ where: { id: { in: ids }, parentAgencyId: null, type: "CLIENT" }, data: { parentAgencyId: agencyId } });
      linked += res.count;
    }
  }

  // ---- 4. Monthly spend (Net3) into each account's Spend history ----
  let spendRows = 0;
  if (body.options?.importSpend) {
    const periods = REPORT_MONTHS.map(monthToDate);
    const accountIds = Array.from(new Set(keyToAccount.values()));
    const existing = await prisma.accountGrowthMetric.findMany({
      where: { accountId: { in: accountIds }, channelType: null, period: { in: periods } },
      select: { id: true, accountId: true, period: true },
    });
    const existingMap = new Map(existing.map((e) => [`${e.accountId}|${e.period.toISOString()}`, e.id]));

    // Several report rows can land on one CRM account - add them together.
    const totals = new Map<string, number>();
    for (const [key, accountId] of Array.from(keyToAccount.entries())) {
      const r = report.get(key);
      if (!r) continue;
      r.months.forEach((v, i) => {
        if (!v) return;
        const k = `${accountId}|${periods[i].toISOString()}`;
        totals.set(k, (totals.get(k) ?? 0) + v);
      });
    }
    const creates: { accountId: string; period: Date; spendAmount: number }[] = [];
    for (const [k, v] of Array.from(totals.entries())) {
      const id = existingMap.get(k);
      if (id) {
        await prisma.accountGrowthMetric.update({ where: { id }, data: { spendAmount: v } });
      } else {
        const [accountId, iso] = k.split("|");
        creates.push({ accountId, period: new Date(iso), spendAmount: v });
      }
      spendRows++;
    }
    if (creates.length) await prisma.accountGrowthMetric.createMany({ data: creates });
  }

  return NextResponse.json({
    created: created.length,
    matched: matchedRows,
    execChanged,
    linked,
    spendRows,
    unassigned,
    newUsers,
  });
}

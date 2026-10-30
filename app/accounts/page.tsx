import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Avatar, TypeBadge, TierBadge } from "@/components/Badge";
import HealthPill from "@/components/HealthPill";
import { healthFor, lastActivityByAccount } from "@/lib/health";
import { getCurrentUser } from "@/lib/permissions";

// Always fetch fresh from the database - this page has no dynamic API calls
// of its own, so Next.js would otherwise treat it as static and cache it at
// build time, meaning edits (e.g. changing an account's type) wouldn't show
// up here until the next deploy.
export const dynamic = "force-dynamic";

const HEALTH_OPTIONS = [
  { value: "", label: "Any activity" },
  { value: "ACTIVE", label: "Active (last 60 days)" },
  { value: "COOLING", label: "Cooling (60–89 days)" },
  { value: "COLD", label: "Cold (90+ days)" },
  { value: "NONE", label: "No activity yet" },
];

// Server component - reads straight from Prisma rather than calling our own
// API route, since this runs on the server anyway.
export default async function AccountsListPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; tier?: string; exec?: string; health?: string };
}) {
  const user = await getCurrentUser();
  const q = searchParams.q?.trim() ?? "";
  const type = ["CLIENT", "AGENCY"].includes(searchParams.type ?? "") ? searchParams.type! : "";
  const tier = ["TIER_1", "TIER_2", "TIER_3", "TO_BE_ASSIGNED"].includes(searchParams.tier ?? "") ? searchParams.tier! : "";
  const exec = searchParams.exec ?? "";
  const health = searchParams.health ?? "";

  const where: Prisma.AccountWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (type) where.type = type as Prisma.AccountWhereInput["type"];
  if (tier) where.tier = tier as Prisma.AccountWhereInput["tier"];
  if (exec === "me" && user) where.salesExecutiveId = user.id;
  else if (exec) where.salesExecutiveId = exec;

  const [accounts, salesUsers, lastActivity] = await Promise.all([
    prisma.account.findMany({
      where,
      include: { salesExecutive: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "SALES" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    lastActivityByAccount(),
  ]);

  const rows = accounts
    .map((a) => ({ ...a, health: healthFor(lastActivity.get(a.id)) }))
    .filter((a) => !health || a.health.status === health);

  const filtered = Boolean(q || type || tier || exec || health);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Accounts</h1>
        <div className="flex gap-2">
          <a href="/api/accounts/export" className="rounded border border-navy px-4 py-2 text-sm text-navy">
            Download CSV
          </a>
          <Link href="/accounts/new" className="rounded bg-navy px-4 py-2 text-sm text-white">
            + New account
          </Link>
        </div>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2 text-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name contains..."
          className="w-48 rounded border border-gray-300 px-3 py-2"
        />
        <select name="type" defaultValue={type} className="rounded border border-gray-300 px-3 py-2">
          <option value="">Clients &amp; agencies</option>
          <option value="CLIENT">Clients</option>
          <option value="AGENCY">Agencies</option>
        </select>
        <select name="tier" defaultValue={tier} className="rounded border border-gray-300 px-3 py-2">
          <option value="">Any tier</option>
          <option value="TIER_1">Tier 1</option>
          <option value="TIER_2">Tier 2</option>
          <option value="TIER_3">Tier 3</option>
          <option value="TO_BE_ASSIGNED">To Be Assigned</option>
        </select>
        <select name="exec" defaultValue={exec} className="rounded border border-gray-300 px-3 py-2">
          <option value="">Any sales exec</option>
          {user?.role === "SALES" && <option value="me">My accounts</option>}
          {salesUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select name="health" defaultValue={health} className="rounded border border-gray-300 px-3 py-2">
          {HEALTH_OPTIONS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded bg-navy px-4 py-2 text-white">
          Filter
        </button>
        {filtered && (
          <Link href="/accounts" className="px-2 py-2 text-gray-500 hover:underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-4 text-sm text-gray-500">
        {rows.length} {rows.length === 1 ? "account" : "accounts"}
      </p>

      <div className="overflow-x-auto">
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Tier</th>
              <th className="py-2 pr-3">Sales exec</th>
              <th className="py-2">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((account) => (
              <tr key={account.id} className="border-b border-gray-100 hover:bg-white">
                <td className="py-3 pr-3">
                  <Link
                    href={`/accounts/${account.id}`}
                    className="flex items-center gap-3 font-medium text-navy hover:underline"
                  >
                    <Avatar name={account.name} />
                    {account.name}
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  <TypeBadge type={account.type} />
                </td>
                <td className="py-3 pr-3">
                  <TierBadge tier={account.tier} />
                </td>
                <td className="whitespace-nowrap py-3 pr-3 text-gray-600">{account.salesExecutive.name}</td>
                <td className="py-3">
                  <HealthPill health={account.health} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  {filtered ? "No accounts match these filters." : "No accounts yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

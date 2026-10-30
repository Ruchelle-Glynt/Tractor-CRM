import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TierBadge } from "@/components/Badge";
import HealthPill from "@/components/HealthPill";
import { healthFor } from "@/lib/health";
import { formatRandShort } from "@/lib/activity";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const TIER_COLORS: Record<string, string> = {
  TIER_1: "#FF005B",
  TIER_2: "#F7D849",
  TIER_3: "#04CA95",
  TO_BE_ASSIGNED: "#D1D5DB",
};

// Agency view: every media agency with the clients it manages, rolled up -
// activity across the agency and its clients, client spend, tiers, industries.
export default async function AgenciesPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = ["clients", "activity", "spend", "name"].includes(searchParams.sort ?? "") ? searchParams.sort! : "clients";
  const since90 = new Date(Date.now() - 90 * DAY_MS);
  const now = new Date();
  const since12m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const [agencies, activity90, lastActivity, spend12] = await Promise.all([
    prisma.account.findMany({
      where: { type: "AGENCY" },
      select: {
        id: true,
        name: true,
        tier: true,
        salesExecutive: { select: { name: true } },
        clients: {
          select: { id: true, name: true, tier: true, category: { select: { mainCategory: true } } },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.activity.groupBy({ by: ["accountId"], where: { activityDate: { gte: since90 } }, _count: { _all: true } }),
    prisma.activity.groupBy({ by: ["accountId"], _max: { activityDate: true } }),
    prisma.accountGrowthMetric.groupBy({ by: ["accountId"], where: { period: { gte: since12m } }, _sum: { spendAmount: true } }),
  ]);

  const actCount = new Map(activity90.map((r) => [r.accountId, r._count._all]));
  const lastAct = new Map(lastActivity.map((r) => [r.accountId, r._max.activityDate]));
  const spend = new Map(spend12.map((r) => [r.accountId, Number(r._sum.spendAmount ?? 0)]));

  const rows = agencies.map((a) => {
    const ids = [a.id, ...a.clients.map((c) => c.id)];
    const latest = ids
      .map((id) => lastAct.get(id))
      .filter((d): d is Date => Boolean(d))
      .sort((x, y) => y.getTime() - x.getTime())[0];
    const tierCounts = a.clients.reduce<Record<string, number>>((acc, c) => {
      acc[c.tier] = (acc[c.tier] ?? 0) + 1;
      return acc;
    }, {});
    const industries = Array.from(
      new Set(a.clients.map((c) => c.category?.mainCategory).filter((v): v is string => Boolean(v)))
    );
    return {
      ...a,
      activity: ids.reduce((s, id) => s + (actCount.get(id) ?? 0), 0),
      clientSpend: a.clients.reduce((s, c) => s + (spend.get(c.id) ?? 0), 0),
      health: healthFor(latest),
      tierCounts,
      industries,
    };
  });

  rows.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "activity"
      ? b.activity - a.activity || a.name.localeCompare(b.name)
      : sort === "spend"
      ? b.clientSpend - a.clientSpend || a.name.localeCompare(b.name)
      : b.clients.length - a.clients.length || a.name.localeCompare(b.name)
  );

  const linkedClients = rows.reduce((s, r) => s + r.clients.length, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Agencies</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rows.length} media agencies managing {linkedClients} linked clients. Link a client to its agency from the
            client&apos;s Edit screen.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          {[
            { key: "clients", label: "Most clients" },
            { key: "activity", label: "Most active" },
            { key: "spend", label: "Client spend" },
            { key: "name", label: "A–Z" },
          ].map((s) => (
            <Link
              key={s.key}
              href={`/agencies?sort=${s.key}`}
              className={`rounded-md px-3 py-1.5 ${sort === s.key ? "bg-navy text-white" : "border border-gray-300 text-gray-700 hover:border-navy"}`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">No agencies yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((a) => (
            <section key={a.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/accounts/${a.id}`} className="block truncate text-lg font-bold hover:underline">
                    {a.name}
                  </Link>
                  <p className="text-xs text-gray-500">{a.salesExecutive.name}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <TierBadge tier={a.tier} />
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 py-2">
                  <dt className="text-[11px] text-gray-500">Clients</dt>
                  <dd className="font-heading text-xl font-black">{a.clients.length}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 py-2">
                  <dt className="text-[11px] text-gray-500">Activity, 90 days</dt>
                  <dd className="font-heading text-xl font-black">{a.activity}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 py-2">
                  <dt className="text-[11px] text-gray-500">Client spend, 12m</dt>
                  <dd className="font-heading text-xl font-black">{a.clientSpend > 0 ? formatRandShort(a.clientSpend) : "-"}</dd>
                </div>
              </dl>

              {a.clients.length > 0 && (
                <div className="mt-4">
                  {/* Tier mix of the agency's clients */}
                  <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                    {["TIER_1", "TIER_2", "TIER_3", "TO_BE_ASSIGNED"].map((t) =>
                      a.tierCounts[t] ? (
                        <div
                          key={t}
                          title={`${t.replace("_", " ").replace("TO BE ASSIGNED", "To be assigned")}: ${a.tierCounts[t]}`}
                          style={{ width: `${(a.tierCounts[t] / a.clients.length) * 100}%`, backgroundColor: TIER_COLORS[t] }}
                        />
                      ) : null
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {["TIER_1", "TIER_2", "TIER_3"]
                      .filter((t) => a.tierCounts[t])
                      .map((t) => `${a.tierCounts[t]} × Tier ${t.slice(-1)}`)
                      .join(" · ") || "Tiers not assigned yet"}
                  </p>
                  <p className="mt-3 text-sm text-gray-700">
                    {a.clients.slice(0, 8).map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ", "}
                        <Link href={`/accounts/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </span>
                    ))}
                    {a.clients.length > 8 && <span className="text-gray-400"> + {a.clients.length - 8} more</span>}
                  </p>
                  {a.industries.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">Industries: {a.industries.join(", ")}</p>
                  )}
                </div>
              )}
              {a.clients.length === 0 && <p className="mt-4 text-sm text-gray-400">No clients linked yet.</p>}

              <div className="mt-auto pt-4">
                <HealthPill health={a.health} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

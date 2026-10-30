import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatRand } from "@/lib/activity";
import { getCurrentUser } from "@/lib/permissions";

// Always load fresh from the database - otherwise Next.js caches this page
// at deploy time and new leads/accounts don't show until the next deploy.
export const dynamic = "force-dynamic";

const SOURCES = [
  { value: "WEBSITE", label: "Website", color: "#4C22F2" },
  { value: "SOCIAL", label: "Social", color: "#FF005B" },
  { value: "TELEPHONIC", label: "Telephonic", color: "#04CA95" },
  { value: "OTHER", label: "Other", color: "#9CA3AF" },
];
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: "#FFE4EC", text: "#BE0044", label: "New" },
  CONTACTED: { bg: "#FEF3C7", text: "#92400E", label: "Contacted" },
  CONVERTED: { bg: "#D1FAE5", text: "#065F46", label: "Converted" },
  LOST: { bg: "#F3F4F6", text: "#6B7280", label: "Lost" },
};
const PERIODS = [
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; period?: string; mine?: string };
}) {
  const user = await getCurrentUser();
  const status = STATUS_STYLE[searchParams.status ?? ""] ? searchParams.status! : "";
  const period = PERIODS.some((p) => p.value === searchParams.period) ? searchParams.period! : "365";
  const mine = searchParams.mine === "1";

  const base: Prisma.LeadWhereInput = {};
  if (period !== "all") base.createdAt = { gte: new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000) };
  if (mine && user) base.transferredToUserId = user.id;

  const [allInPeriod, leads] = await Promise.all([
    prisma.lead.findMany({
      where: base,
      select: { source: true, status: true, convertedValue: true, createdAt: true, convertedAt: true },
    }),
    prisma.lead.findMany({
      where: { ...base, ...(status ? { status: status as Prisma.LeadWhereInput["status"] } : {}) },
      include: {
        linkedAccount: { select: { id: true, name: true } },
        transferredToUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // ---- Stats ----
  const total = allInPeriod.length;
  const converted = allInPeriod.filter((l) => l.status === "CONVERTED");
  const closed = allInPeriod.filter((l) => l.status === "CONVERTED" || l.status === "LOST").length;
  const conversionRate = closed > 0 ? (converted.length / closed) * 100 : null;
  const convertedValue = converted.reduce((s, l) => s + (l.convertedValue === null ? 0 : Number(l.convertedValue)), 0);
  const daysToConvert = converted
    .filter((l) => l.convertedAt)
    .map((l) => ((l.convertedAt as Date).getTime() - l.createdAt.getTime()) / (24 * 60 * 60 * 1000));
  const avgDays = daysToConvert.length ? Math.round(daysToConvert.reduce((s, d) => s + d, 0) / daysToConvert.length) : null;

  const bySource = SOURCES.map((s) => {
    const rows = allInPeriod.filter((l) => l.source === s.value);
    const conv = rows.filter((l) => l.status === "CONVERTED").length;
    const done = rows.filter((l) => l.status === "CONVERTED" || l.status === "LOST").length;
    return { ...s, count: rows.length, converted: conv, rate: done > 0 ? (conv / done) * 100 : null };
  });
  const maxSource = Math.max(1, ...bySource.map((s) => s.count));
  const statusCounts = Object.keys(STATUS_STYLE).reduce<Record<string, number>>((acc, k) => {
    acc[k] = allInPeriod.filter((l) => l.status === k).length;
    return acc;
  }, {});

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({ period, ...(status ? { status } : {}), ...(mine ? { mine: "1" } : {}), ...over });
    for (const [k, v] of Array.from(p.entries())) if (!v) p.delete(k);
    return `/leads?${p.toString()}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">Leads</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <form method="get" className="flex items-center gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            {mine && <input type="hidden" name="mine" value="1" />}
            <select name="period" defaultValue={period} className="rounded border border-gray-300 px-3 py-2">
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded border border-navy px-3 py-2 text-navy">
              Show
            </button>
          </form>
          <Link href="/leads/new" className="rounded bg-navy px-4 py-2 text-white">
            + New lead
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile color="#4C22F2" label="Leads in" value={total.toLocaleString("en-ZA")} note={PERIODS.find((p) => p.value === period)?.label ?? ""} />
        <Tile
          color="#04CA95"
          label="Conversion rate"
          value={conversionRate === null ? "-" : `${conversionRate.toFixed(0)}%`}
          note={closed > 0 ? `${converted.length} of ${closed} closed leads` : "No closed leads yet"}
        />
        <Tile color="#F7D849" label="Converted value" value={formatRand(convertedValue) || "R0"} note={`${converted.length} converted`} />
        <Tile
          color="#FF005B"
          label="Days to convert"
          value={avgDays === null ? "-" : String(avgDays)}
          note="Average, lead in to converted"
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">Where leads come from</h2>
        <ul className="mt-4 space-y-3">
          {bySource.map((s) => (
            <li key={s.value} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[110px_1fr_200px]">
              <span className="font-medium">{s.label}</span>
              <div className="h-3 rounded-full bg-gray-100">
                <div className="h-3 rounded-full" style={{ width: `${(s.count / maxSource) * 100}%`, backgroundColor: s.color }} />
              </div>
              <span className="text-right text-gray-600">
                <span className="font-semibold text-gray-900">{s.count}</span>
                <span className="hidden sm:inline">
                  {" "}
                  · {s.converted} converted{s.rate !== null ? ` (${s.rate.toFixed(0)}%)` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <Link href={qs({ status: "" })} className={`rounded-md px-3 py-1.5 ${!status ? "bg-navy text-white" : "border border-gray-300"}`}>
            All ({total})
          </Link>
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <Link key={k} href={qs({ status: k })} className={`rounded-md px-3 py-1.5 ${status === k ? "bg-navy text-white" : "border border-gray-300"}`}>
              {v.label} ({statusCounts[k]})
            </Link>
          ))}
          {user && (
            <Link href={qs({ mine: mine ? "" : "1" })} className={`ml-auto rounded-md px-3 py-1.5 ${mine ? "bg-yellow text-black" : "border border-gray-300"}`}>
              {mine ? "Showing my leads" : "Only my leads"}
            </Link>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="py-2 pr-3">Contact</th>
                <th className="py-2 pr-3">Company</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">With</th>
                <th className="py-2 pr-3">Linked account</th>
                <th className="py-2">Came in</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-white">
                  <td className="py-3 pr-3">
                    <Link href={`/leads/${l.id}`} className="font-medium text-navy hover:underline">
                      {l.contactName}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">{l.companyName ?? "-"}</td>
                  <td className="py-3 pr-3">{SOURCES.find((s) => s.value === l.source)?.label ?? l.source}</td>
                  <td className="py-3 pr-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: STATUS_STYLE[l.status].bg, color: STATUS_STYLE[l.status].text }}
                    >
                      {STATUS_STYLE[l.status].label}
                    </span>
                  </td>
                  <td className="py-3 pr-3">{l.transferredToUser.name}</td>
                  <td className="py-3 pr-3">
                    {l.linkedAccount ? (
                      <Link href={`/accounts/${l.linkedAccount.id}`} className="hover:underline">
                        {l.linkedAccount.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3 text-gray-500">
                    {l.createdAt.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    No leads here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ color, label, value, note }: { color: string; label: string; value: string; note: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 font-heading text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{note}</p>
    </div>
  );
}

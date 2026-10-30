import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TierBadge } from "@/components/Badge";
import { formatRandShort } from "@/lib/activity";
import {
  BRANDS,
  MEDIA,
  MEDIA_COLORS,
  DIGITAL_MEDIA,
  MARKET_TOTAL,
  NIELSEN_PERIOD,
  NIELSEN_SOURCE,
  NIELSEN_YEAR,
  matchAccountName,
  niceName,
  normalizeName,
  billboardSpend,
  spendFor,
  sumMedia,
} from "@/lib/nielsen";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "overview", label: "Market overview" },
  { key: "clients", label: "Our clients" },
  { key: "prospects", label: "Prospects" },
];
const MIN_SPEND = [
  { value: "0", label: "Any spend" },
  { value: "1000000", label: "R1m+" },
  { value: "5000000", label: "R5m+" },
  { value: "10000000", label: "R10m+" },
];

// Market view built on Nielsen out-of-home ad spend: the whole market, how
// our clients compare (share of wallet), and the biggest spenders we don't
// work with yet.
export default async function MarketPage({
  searchParams,
}: {
  searchParams: { tab?: string; media?: string; min?: string };
}) {
  const tab = TABS.some((t) => t.key === searchParams.tab) ? searchParams.tab! : "overview";
  const mediaIdx = searchParams.media !== undefined && searchParams.media !== "" && MEDIA[Number(searchParams.media)] ? Number(searchParams.media) : null;
  const min = MIN_SPEND.some((m) => m.value === searchParams.min) ? Number(searchParams.min) : 1000000;

  const yearStart = new Date(Date.UTC(NIELSEN_YEAR, 0, 1));
  const yearEnd = new Date(Date.UTC(NIELSEN_YEAR + 1, 0, 1));
  const [clients, tractorSpend] = await Promise.all([
    prisma.account.findMany({
      where: { type: "CLIENT" },
      select: { id: true, name: true, tier: true, salesExecutive: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.accountGrowthMetric.groupBy({
      by: ["accountId"],
      where: { period: { gte: yearStart, lt: yearEnd } },
      _sum: { spendAmount: true },
    }),
  ]);
  const tractorByAccount = new Map(tractorSpend.map((r) => [r.accountId, Number(r._sum.spendAmount ?? 0)]));

  // Match every client account to Nielsen
  const matched = clients
    .map((c) => ({ ...c, match: matchAccountName(c.name) }))
    .filter((c): c is typeof c & { match: NonNullable<typeof c.match> } => c.match !== null);
  const clientRows = matched
    .map((c) => ({ ...c, ooh: c.match.total, billboards: billboardSpend(c.match), ours: tractorByAccount.get(c.id) ?? 0 }))
    .sort((a, b) => b.ooh - a.ooh);
  const advertisersInCrm = new Set(matched.flatMap((c) => c.match.brands.map((b) => b.advertiserIdx)));
  const matchedTotal = matched.reduce((s, c) => s + spendFor(c.match, mediaIdx), 0);

  // Advertiser totals (for the selected media type)
  const byAdvertiser = new Map<number, { idx: number; name: string; total: number; byMedia: number[]; brands: { brand: string; total: number }[] }>();
  for (const b of BRANDS) {
    const row =
      byAdvertiser.get(b.advertiserIdx) ??
      { idx: b.advertiserIdx, name: b.advertiser, total: 0, byMedia: MEDIA.map(() => 0), brands: [] };
    row.total += spendFor(b, mediaIdx);
    b.byMedia.forEach((v, i) => (row.byMedia[i] += v));
    row.brands.push({ brand: b.brand, total: spendFor(b, mediaIdx) });
    byAdvertiser.set(b.advertiserIdx, row);
  }
  const advertisers = Array.from(byAdvertiser.values())
    .filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);

  const marketTotal = mediaIdx === null ? MARKET_TOTAL : sumMedia(BRANDS)[mediaIdx];
  const mediaTotals = sumMedia(BRANDS);
  const digitalTotal = mediaTotals.reduce((s, v, i) => s + (DIGITAL_MEDIA.has(i) ? v : 0), 0);

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({
      tab,
      ...(mediaIdx !== null ? { media: String(mediaIdx) } : {}),
      ...(tab === "prospects" ? { min: String(min) } : {}),
      ...over,
    });
    for (const [k, v] of Array.from(p.entries())) if (v === "") p.delete(k);
    return `/market?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Market</h1>
        <p className="mt-1 text-sm text-gray-500">
          Out-of-home ad spend, {NIELSEN_PERIOD}. Source: {NIELSEN_SOURCE}.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
        <nav className="flex gap-1 text-sm">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={qs({ tab: t.key })}
              className={`-mb-px border-b-2 px-3 py-2 font-medium ${
                tab === t.key ? "border-navy text-navy" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form method="get" className="flex items-center gap-2 pb-2 text-sm">
          <input type="hidden" name="tab" value={tab} />
          {tab === "prospects" && (
            <select name="min" defaultValue={String(min)} className="rounded border border-gray-300 px-2 py-1.5">
              {MIN_SPEND.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
          {tab !== "clients" && (
          <select name="media" defaultValue={mediaIdx === null ? "" : String(mediaIdx)} className="rounded border border-gray-300 px-2 py-1.5">
            <option value="">All media types</option>
            {MEDIA.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          )}
          {tab !== "clients" && (
            <button type="submit" className="rounded bg-navy px-3 py-1.5 text-white">
            Apply
          </button>
          )}
        </form>
      </div>

      {tab === "overview" && (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile color="#4C22F2" label={mediaIdx === null ? "Total OOH spend" : MEDIA[mediaIdx]} value={formatRandShort(marketTotal)} note={`${NIELSEN_YEAR}, all advertisers`} />
            <Tile color="#FF005B" label="Digital share" value={`${Math.round((digitalTotal / MARKET_TOTAL) * 100)}%`} note={`${formatRandShort(digitalTotal)} on digital OOH`} />
            <Tile color="#04CA95" label="Our clients' spend" value={formatRandShort(matchedTotal)} note={`${Math.round((matchedTotal / Math.max(1, marketTotal)) * 100)}% of the market · ${matched.length} clients`} />
            <Tile color="#F7D849" label="Advertisers" value={advertisers.length.toLocaleString("en-ZA")} note={`${advertisers.filter((a) => !advertisersInCrm.has(a.idx)).length.toLocaleString("en-ZA")} not in the CRM`} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold">Spend by media type</h2>
            <ul className="mt-4 space-y-3">
              {MEDIA.map((m, i) => ({ m, i, v: mediaTotals[i] }))
                .sort((a, b) => b.v - a.v)
                .map(({ m, i, v }) => (
                  <li key={m} className="grid grid-cols-[150px_1fr_110px] items-center gap-3 text-sm">
                    <Link href={qs({ media: mediaIdx === i ? "" : String(i) })} className={`truncate hover:underline ${mediaIdx === i ? "font-semibold" : ""}`}>
                      {m}
                    </Link>
                    <div className="h-3 rounded-full bg-gray-100">
                      <div className="h-3 rounded-full" style={{ width: `${(v / Math.max(...mediaTotals)) * 100}%`, backgroundColor: MEDIA_COLORS[i] }} />
                    </div>
                    <span className="text-right">
                      <span className="font-semibold">{formatRandShort(v)}</span>
                      <span className="text-gray-400"> · {Math.round((v / MARKET_TOTAL) * 100)}%</span>
                    </span>
                  </li>
                ))}
            </ul>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">Top 25 advertisers{mediaIdx !== null ? ` · ${MEDIA[mediaIdx]}` : ""}</h2>
              <Link href={qs({ tab: "prospects" })} className="whitespace-nowrap text-sm font-medium hover:underline">
                Prospects →
              </Link>
            </div>
            <AdvertiserTable rows={advertisers.slice(0, 25)} inCrm={advertisersInCrm} marketTotal={marketTotal} />
          </section>
        </>
      )}

      {tab === "clients" && (
        <>
          {(() => {
            const withSpend = clientRows.filter((c) => c.ours > 0);
            const ours = withSpend.reduce((s, c) => s + c.ours, 0);
            const ooh = withSpend.reduce((s, c) => s + c.ooh, 0);
            const bb = withSpend.reduce((s, c) => s + c.billboards, 0);
            return (
              <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Tile color="#04CA95" label={`With Tractor, ${NIELSEN_YEAR}`} value={ours > 0 ? formatRandShort(ours) : "-"} note={`${withSpend.length} of ${clientRows.length} matched clients have spend entered`} />
                <Tile color="#4C22F2" label="Share of total OOH" value={ooh > 0 && ours > 0 ? `${Math.round((ours / ooh) * 100)}%` : "-"} note={ooh > 0 ? `of ${formatRandShort(ooh)} these clients spent` : "Enter Tractor spend to see this"} />
                <Tile color="#000000" label="Share of billboards" value={bb > 0 && ours > 0 ? `${Math.round(Math.min(1, ours / bb) * 100)}%` : "-"} note={bb > 0 ? `of ${formatRandShort(bb)} on billboards (digital + classic)` : "Enter Tractor spend to see this"} />
                <Tile color="#F7D849" label="Clients matched" value={String(clientRows.length)} note={`${clients.length - clientRows.length} not found in Nielsen`} />
              </section>
            );
          })()}

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold">Share of wallet</h2>
          <p className="text-sm text-gray-500">
            What each client spent with Tractor in {NIELSEN_YEAR} (from the Spend section on each account) as a share of their total
            out-of-home spend, and of their billboard spend only (digital + classic), per Nielsen. Shares show once Tractor spend for{" "}
            {NIELSEN_YEAR} has been entered.
          </p>
          {clientRows.length === 0 ? (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">No client names matched Nielsen yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-500">
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3 text-right">With Tractor</th>
                    <th className="py-2 pr-3">Total OOH {NIELSEN_YEAR}</th>
                    <th className="py-2">Billboards {NIELSEN_YEAR}</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRows.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-2.5 pr-3">
                        <Link href={`/accounts/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <span className="block text-xs text-gray-400">
                          {c.salesExecutive.name}
                          {(c.match.brands.length > 1 || normalizeName(c.match.brands[0].brand) !== normalizeName(c.name)) &&
                            ` · ${c.match.brands.slice(0, 2).map((b) => niceName(b.brand)).join(", ")}${
                              c.match.brands.length > 2 ? ` +${c.match.brands.length - 2}` : ""
                            }`}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <TierBadge tier={c.tier} />
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right">
                        {c.ours > 0 ? <span className="font-semibold">{formatRandShort(c.ours)}</span> : <span className="text-gray-400">Not entered</span>}
                      </td>
                      <td className="w-56 py-2.5 pr-3">
                        <ShareCell spend={c.ooh} ours={c.ours} color="#4C22F2" />
                      </td>
                      <td className="w-56 py-2.5">
                        <ShareCell spend={c.billboards} ours={c.ours} color="#000000" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400">
            {clients.length - matched.length} client {clients.length - matched.length === 1 ? "account" : "accounts"} didn&apos;t match a Nielsen name (for example local businesses, or a name spelt
            differently). Those can be linked by hand - ask for the account and the Nielsen name to be added to the manual list.
          </p>
        </section>
        </>
      )}

      {tab === "prospects" && (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold">Biggest OOH spenders not in the CRM</h2>
          <p className="text-sm text-gray-500">
            Advertisers with no matching client account, ranked by {NIELSEN_YEAR} spend{mediaIdx !== null ? ` on ${MEDIA[mediaIdx]}` : ""}. Add one as a lead to start the conversation.
          </p>
          <AdvertiserTable
            rows={advertisers.filter((a) => !advertisersInCrm.has(a.idx) && a.total >= min).slice(0, 100)}
            inCrm={advertisersInCrm}
            marketTotal={marketTotal}
            showLead
          />
        </section>
      )}
    </div>
  );
}

function AdvertiserTable({
  rows,
  inCrm,
  marketTotal,
  showLead = false,
}: {
  rows: { idx: number; name: string; total: number; byMedia: number[]; brands: { brand: string; total: number }[] }[];
  inCrm: Set<number>;
  marketTotal: number;
  showLead?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Nothing matches these filters.</p>;
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th className="w-8 py-2 pr-2">#</th>
            <th className="py-2 pr-3">Advertiser</th>
            <th className="py-2 pr-3">Media mix</th>
            <th className="py-2 pr-3 text-right">Spend · share</th>
            <th className="py-2 text-right">{showLead ? "" : "Status"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => {
            const topBrands = [...a.brands].sort((x, y) => y.total - x.total).filter((b) => b.total > 0);
            const mixTotal = a.byMedia.reduce((s, v) => s + v, 0) || 1;
            const crm = inCrm.has(a.idx);
            return (
              <tr key={a.idx} className="border-b border-gray-100 align-top">
                <td className="py-2.5 pr-2 text-gray-400">{i + 1}</td>
                <td className="py-2.5 pr-3">
                  <span className="font-medium">{niceName(a.name)}</span>
                  {topBrands.length > 1 || (topBrands[0] && topBrands[0].brand !== a.name) ? (
                    <span className="block text-xs text-gray-400">
                      {topBrands.slice(0, 3).map((b) => niceName(b.brand)).join(", ")}
                      {topBrands.length > 3 ? ` +${topBrands.length - 3} brands` : ""}
                    </span>
                  ) : null}
                </td>
                <td className="w-40 py-2.5 pr-3">
                  <div className="mt-1.5 flex h-2 w-36 overflow-hidden rounded-full bg-gray-100" title={MEDIA.map((m, j) => (a.byMedia[j] ? `${m}: ${formatRandShort(a.byMedia[j])}` : "")).filter(Boolean).join("\n")}>
                    {a.byMedia.map((v, j) => (v > 0 ? <div key={j} style={{ width: `${(v / mixTotal) * 100}%`, backgroundColor: MEDIA_COLORS[j] }} /> : null))}
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-right">
                  <span className="font-semibold">{formatRandShort(a.total)}</span>
                  <span className="ml-2 inline-block w-11 text-[11px] text-gray-400">{((a.total / Math.max(1, marketTotal)) * 100).toFixed(1)}%</span>
                </td>
                <td className="whitespace-nowrap py-2.5 text-right">
                  {showLead ? (
                    <Link
                      href={`/leads/new?company=${encodeURIComponent(niceName(a.name))}`}
                      className="rounded border border-navy px-2.5 py-1 text-xs font-semibold hover:bg-navy hover:text-white"
                    >
                      + Lead
                    </Link>
                  ) : crm ? (
                    <span className="rounded-full bg-[#D1FAE5] px-2.5 py-0.5 text-[11px] font-semibold text-[#065F46]">In CRM</span>
                  ) : (
                    <span className="rounded-full bg-[#FFE4EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#BE0044]">Prospect</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        {MEDIA.map((m, j) => (
          <span key={m} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: MEDIA_COLORS[j] }} />
            {m}
          </span>
        ))}
      </p>
    </div>
  );
}

function Tile({ color, label, value, note }: { color: string; label: string; value: string; note: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{note}</p>
    </div>
  );
}

function ShareCell({ spend, ours, color }: { spend: number; ours: number; color: string }) {
  if (spend <= 0) return <span className="text-xs text-gray-400">None in {NIELSEN_YEAR}</span>;
  const share = ours > 0 ? Math.min(100, (ours / spend) * 100) : null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-gray-500">{formatRandShort(spend)}</span>
        <span className="text-xs font-semibold">{share === null ? "-" : `${share.toFixed(0)}%`}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-100">
        {share !== null && <div className="h-2 rounded-full" style={{ width: `${Math.max(2, share)}%`, backgroundColor: color }} />}
      </div>
    </div>
  );
}

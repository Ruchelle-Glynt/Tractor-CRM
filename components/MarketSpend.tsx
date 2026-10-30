import Link from "next/link";
import { formatRandShort } from "@/lib/activity";
import { MEDIA, MEDIA_COLORS, NIELSEN_YEAR, matchAccountName, niceName, billboardSpend } from "@/lib/nielsen";

// Nielsen out-of-home spend for this client, with Tractor's share of it.
export default function MarketSpend({ accountName, tractorSpend }: { accountName: string; tractorSpend: number }) {
  const match = matchAccountName(accountName);
  const billboards = match ? billboardSpend(match) : 0;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy">Market spend</h2>
        <Link href="/market?tab=clients" className="text-sm text-gray-500 hover:underline">
          All clients →
        </Link>
      </div>
      {!match ? (
        <p className="mt-2 text-sm text-gray-400">
          No match for &quot;{accountName}&quot; in the Nielsen {NIELSEN_YEAR} out-of-home report. It may not have advertised out of
          home, or Nielsen uses a different name.
        </p>
      ) : (
        <div className="mt-3 rounded border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-500">With Tractor in {NIELSEN_YEAR}</p>
              <p className="font-heading text-2xl font-bold">{tractorSpend > 0 ? formatRandShort(tractorSpend) : "-"}</p>
            </div>
            <ShareStat label={`Total OOH ${NIELSEN_YEAR}`} spend={match.total} ours={tractorSpend} />
            <ShareStat label={`Billboards ${NIELSEN_YEAR}`} spend={billboards} ours={tractorSpend} note="digital + classic" />
          </div>

          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-gray-100">
            {match.byMedia.map((v, i) =>
              v > 0 ? <div key={i} title={`${MEDIA[i]}: ${formatRandShort(v)}`} style={{ width: `${(v / match.total) * 100}%`, backgroundColor: MEDIA_COLORS[i] }} /> : null
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
            {match.byMedia
              .map((v, i) => ({ v, i }))
              .filter((x) => x.v > 0)
              .sort((a, b) => b.v - a.v)
              .map(({ v, i }) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: MEDIA_COLORS[i] }} />
                  {MEDIA[i]} <span className="font-semibold text-gray-900">{formatRandShort(v)}</span>
                </li>
              ))}
          </ul>

          <p className="mt-3 text-xs text-gray-400">
            Matched to Nielsen {match.via === "advertiser" ? "advertiser" : match.brands.length === 1 ? "brand" : "brands"}:{" "}
            {match.brands.slice(0, 6).map((b) => niceName(b.brand)).join(", ")}
            {match.brands.length > 6 ? ` +${match.brands.length - 6} more` : ""}
            {tractorSpend === 0 && " · Add Tractor's monthly spend below to see share of wallet."}
          </p>
        </div>
      )}
    </section>
  );
}

function ShareStat({ label, spend, ours, note }: { label: string; spend: number; ours: number; note?: string }) {
  const share = spend > 0 && ours > 0 ? Math.min(100, (ours / spend) * 100) : null;
  return (
    <div>
      <p className="text-gray-500">
        {label}
        {note && <span className="text-xs text-gray-400"> ({note})</span>}
      </p>
      <p className="font-heading text-2xl font-bold">
        {spend > 0 ? formatRandShort(spend) : "-"}
        {share !== null && <span className="ml-2 text-base font-semibold" style={{ color: "#04A57A" }}>{share.toFixed(0)}% ours</span>}
      </p>
    </div>
  );
}

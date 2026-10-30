"use client";
import { useMemo, useState } from "react";
import { formatRand, formatNumber } from "@/lib/activity";

export type SpendItem = { id: string; period: string; spendAmount: number; holdingSize: number | null };

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function compactRand(v: number) {
  if (v >= 1_000_000) return `R${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}m`;
  if (v >= 1_000) return `R${Math.round(v / 1_000)}k`;
  return `R${Math.round(v)}`;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Monthly spend and holding size for one account (spec 4.5, Priority 7):
// a 12-month bar chart, year-on-year comparison, and an entry form.
export default function AccountSpend({
  accountId,
  initialItems,
  canEdit,
}: {
  accountId: string;
  initialItems: SpendItem[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const [period, setPeriod] = useState(monthKey(lastMonth));
  const [spend, setSpend] = useState("");
  const [holding, setHolding] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byMonth = useMemo(() => new Map(items.map((i) => [monthKey(new Date(i.period)), i])), [items]);

  // The 12 months ending this month
  const months = useMemo(() => {
    const out: { key: string; label: string; item?: SpendItem }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = monthKey(d);
      out.push({ key, label: d.toLocaleDateString("en-ZA", { month: "short", timeZone: "UTC" }), item: byMonth.get(key) });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byMonth]);

  const last12 = months.reduce((s, m) => s + (m.item?.spendAmount ?? 0), 0);
  const prev12 = items
    .filter((i) => {
      const t = new Date(i.period).getTime();
      const from = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 23, 1);
      const to = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1);
      return t >= from && t < to;
    })
    .reduce((s, i) => s + i.spendAmount, 0);
  const change = prev12 > 0 ? ((last12 - prev12) / prev12) * 100 : null;
  const latestHolding = [...items].sort((a, b) => b.period.localeCompare(a.period)).find((i) => i.holdingSize !== null);

  const max = niceMax(Math.max(0, ...months.map((m) => m.item?.spendAmount ?? 0)));
  const W = 640;
  const H = 210;
  const padL = 52;
  const padB = 24;
  const padT = 10;
  const plotH = H - padB - padT;
  const slot = (W - padL) / 12;
  const barW = Math.min(30, slot * 0.6);
  const ticks = [0, 0.5, 1].map((f) => f * max);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/accounts/${accountId}/spend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, spendAmount: spend, holdingSize: holding }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setItems([...items.filter((i) => i.id !== data.id && monthKey(new Date(i.period)) !== period), data]);
    setSpend("");
    setHolding("");
    setOpen(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this month's figures?")) return;
    const res = await fetch(`/api/spend/${id}`, { method: "DELETE" });
    if (res.ok) setItems(items.filter((i) => i.id !== id));
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy">Spend</h2>
        {canEdit && !open && (
          <button onClick={() => setOpen(true)} className="rounded border border-navy px-4 py-2 text-sm text-navy">
            + Add month
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={save} className="mt-3 grid grid-cols-1 gap-3 rounded border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4">
          <label className="block">
            <span className="font-medium">Month</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium">Spend (R)</span>
            <input
              inputMode="decimal"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              placeholder="e.g. 250000"
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium">Holding size (optional)</span>
            <input
              inputMode="decimal"
              value={holding}
              onChange={(e) => setHolding(e.target.value)}
              placeholder="Leave blank for pDOOH"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={saving} className="rounded bg-navy px-4 py-2 text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded border border-gray-300 px-4 py-2">
              Cancel
            </button>
          </div>
          {byMonth.has(period) && (
            <p className="text-xs text-gray-500 sm:col-span-4">This month already has figures - saving will replace them.</p>
          )}
          {error && <p className="text-red-600 sm:col-span-4">{error}</p>}
        </form>
      )}

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">
          No spend recorded yet.{canEdit ? " Use + Add month to start the trend." : ""}
        </p>
      ) : (
        <div className="mt-3 rounded border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-gray-500">Last 12 months</p>
              <p className="font-heading text-xl font-bold">{formatRand(Math.round(last12)) || "R0"}</p>
            </div>
            <div>
              <p className="text-gray-500">vs previous 12 months</p>
              <p
                className="font-heading text-xl font-bold"
                style={{ color: change === null ? "#9CA3AF" : change >= 0 ? "#04A57A" : "#FF005B" }}
              >
                {change === null ? "-" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(0)}%`}
              </p>
            </div>
            {latestHolding && (
              <div>
                <p className="text-gray-500">Latest holding size</p>
                <p className="font-heading text-xl font-bold">{latestHolding.holdingSize !== null ? formatNumber(latestHolding.holdingSize) : ""}</p>
              </div>
            )}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full max-w-2xl" role="img" aria-label="Monthly spend, last 12 months">
            {ticks.map((t) => {
              const y = padT + plotH - (t / max) * plotH;
              return (
                <g key={t}>
                  <line x1={padL} x2={W} y1={y} y2={y} stroke="#E5E7EB" strokeWidth={1} />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">
                    {compactRand(t)}
                  </text>
                </g>
              );
            })}
            {months.map((m, i) => {
              const v = m.item?.spendAmount ?? 0;
              const h = (v / max) * plotH;
              const x = padL + i * slot + (slot - barW) / 2;
              const isLast = i === months.length - 1;
              return (
                <g key={m.key}>
                  <title>{`${m.label}: ${m.item ? formatRand(v) || "R0" : "no figure"}${
                    m.item?.holdingSize != null ? ` · holding ${m.item.holdingSize}` : ""
                  }`}</title>
                  {m.item ? (
                    <rect x={x} y={padT + plotH - h} width={barW} height={Math.max(h, 1)} rx={3} fill={isLast ? "#000" : "#04CA95"} />
                  ) : (
                    <rect x={x} y={padT + plotH - 2} width={barW} height={2} fill="#E5E7EB" />
                  )}
                  <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#6B7280">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <button onClick={() => setShowTable(!showTable)} className="mt-2 text-xs font-medium text-gray-500 hover:underline">
            {showTable ? "Hide figures" : "Show all figures"}
          </button>
          {showTable && (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500">
                  <th className="py-2">Month</th>
                  <th className="py-2 text-right">Spend</th>
                  <th className="py-2 text-right">Holding size</th>
                  {canEdit && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {[...items]
                  .sort((a, b) => b.period.localeCompare(a.period))
                  .map((i) => (
                    <tr key={i.id} className="border-b border-gray-100">
                      <td className="py-2">
                        {new Date(i.period).toLocaleDateString("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" })}
                      </td>
                      <td className="py-2 text-right">{formatRand(i.spendAmount) || "R0"}</td>
                      <td className="py-2 text-right">{i.holdingSize ?? "-"}</td>
                      {canEdit && (
                        <td className="py-2 text-right">
                          <button onClick={() => remove(i.id)} className="text-xs text-gray-400 hover:text-red-600">
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}

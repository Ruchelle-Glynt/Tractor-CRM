"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { formatRandShort } from "@/lib/activity";
import { buildPlan, suggestAccount, OFFICES, type Office, type ReportAccount } from "@/lib/importPlan";

type Rep = { name: string; total: number; suggestion: string | null; office: Office };
type Account = { id: string; name: string; type: string; exec: string };
type User = { id: string; name: string };
type Decision = { action: "create" | "match" | "skip"; accountId?: string; type?: "CLIENT" | "AGENCY" };
type Result = {
  created: number;
  matched: number;
  execChanged: number;
  linked: number;
  spendRows: number;
  unassigned: number;
  newUsers: { name: string; email: string; password: string }[];
};

export default function ImportReview({
  report,
  reps,
  accounts,
  users,
}: {
  report: ReportAccount[];
  reps: Rep[];
  accounts: Account[];
  users: User[];
}) {
  const [repMap, setRepMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(reps.map((r) => [r.name, r.suggestion ?? "new"]))
  );
  const [offices, setOffices] = useState<Record<string, Office>>(() => Object.fromEntries(reps.map((r) => [r.name, r.office])));
  // Only rows the Admin has changed are stored; everything else uses the suggestion.
  const [changes, setChanges] = useState<Record<string, Decision>>({});

  // The rows depend on each rep's office (agencies split into JHB / CPT branches)
  const rows = useMemo(() => {
    const planned = buildPlan(report, offices).map((r) => ({
      ...r,
      suggestion: suggestAccount({ name: r.name, aliases: r.aliases, office: r.type === "AGENCY" ? r.office : "" }, accounts),
    }));
    // If two office branches point at the same existing account (one without
    // an office in its name), only the biggest branch keeps it - the other
    // branch becomes a new account.
    const taken = new Set<string>();
    for (const r of [...planned].sort((x, y) => (x.suggestion?.confidence === "exact" ? -1 : 0) - (y.suggestion?.confidence === "exact" ? -1 : 0) || y.total - x.total)) {
      if (!r.suggestion || r.type !== "AGENCY") continue;
      if (taken.has(r.suggestion.id)) r.suggestion = null;
      else taken.add(r.suggestion.id);
    }
    return planned;
  }, [report, offices, accounts]);
  const decisions: Record<string, Decision> = useMemo(
    () =>
      Object.fromEntries(
        rows.map((r) => [
          r.key,
          { ...(r.suggestion ? { action: "match", accountId: r.suggestion.id } : { action: "create" }), type: r.type, ...changes[r.key] } as Decision,
        ])
      ),
    [rows, changes]
  );
  const setDecisions = (next: Record<string, Decision>) => {
    const diff: Record<string, Decision> = {};
    for (const [k, v] of Object.entries(next)) if (v !== decisions[k]) diff[k] = v;
    setChanges((c) => ({ ...c, ...diff }));
  };
  const splitAgencies = rows.filter((r) => r.type === "AGENCY" && r.office).length;

  const [tab, setTab] = useState<"new" | "match" | "skip" | "all">("new");
  const [q, setQ] = useState("");
  const [options, setOptions] = useState({ updateExec: true, linkAgencies: true, importSpend: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const counts = {
    new: rows.filter((r) => decisions[r.key].action === "create").length,
    match: rows.filter((r) => decisions[r.key].action === "match").length,
    skip: rows.filter((r) => decisions[r.key].action === "skip").length,
  };
  const visible = rows.filter(
    (r) =>
      (tab === "all" || (tab === "new" ? decisions[r.key].action === "create" : decisions[r.key].action === tab)) &&
      (!q || `${r.name} ${r.aliases.join(" ")} ${r.agencyName ?? ""} ${r.rep ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );

  function setDecision(key: string, value: string) {
    const cur = decisions[key];
    if (value === "__create") setChanges((c) => ({ ...c, [key]: { ...cur, action: "create", accountId: undefined } }));
    else if (value === "__skip") setChanges((c) => ({ ...c, [key]: { ...cur, action: "skip", accountId: undefined } }));
    else setChanges((c) => ({ ...c, [key]: { ...cur, action: "match", accountId: value } }));
  }

  async function apply() {
    const unmapped = reps.filter((r) => !repMap[r.name]).map((r) => r.name);
    const newReps = reps.filter((r) => repMap[r.name] === "new").map((r) => r.name);
    const msg =
      `Create ${counts.new} new accounts and update ${counts.match} existing ones?` +
      (newReps.length ? `\n\n${newReps.length} new Sales users will be added: ${newReps.join(", ")}.` : "") +
      (unmapped.length ? `\n\n${unmapped.length} sales reps aren't linked to a CRM user (${unmapped.join(", ")}). New accounts of theirs will be assigned to you for now.` : "");
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reps: repMap,
        offices,
        rows: rows.map((r) => ({ key: r.key, ...decisions[r.key] })),
        options,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "The import didn't finish. Nothing may have changed - try again, or send the error to Claude.");
      return;
    }
    setResult(data);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Import complete</h2>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <strong>{result.created}</strong> new accounts created
          </li>
          <li>
            <strong>{result.matched}</strong> existing accounts matched
            {result.execChanged > 0 && `, ${result.execChanged} given a new sales exec`}
          </li>
          <li>
            <strong>{result.linked}</strong> clients linked to their media agency
          </li>
          <li>
            <strong>{result.spendRows}</strong> months of spend recorded
          </li>
          {result.unassigned > 0 && (
            <li className="text-folly">{result.unassigned} new accounts had no linked sales rep and were assigned to you - reassign them from the account page.</li>
          )}
        </ul>
        {result.newUsers.length > 0 && (
          <div className="mt-5 rounded-lg border border-yellow bg-[#FFFBEB] p-4 text-sm">
            <p className="font-semibold">New sales users - share these logins privately. They&apos;re shown only once.</p>
            <table className="mt-2 w-full text-left">
              <tbody>
                {result.newUsers.map((u) => (
                  <tr key={u.email}>
                    <td className="py-1 pr-4">{u.name}</td>
                    <td className="py-1 pr-4 font-mono">{u.email}</td>
                    <td className="py-1 font-mono">{u.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-gray-600">Each person should change their password under Settings after signing in.</p>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <Link href="/accounts" className="rounded bg-navy px-4 py-2 text-sm text-white">
            Go to accounts
          </Link>
          <Link href="/agencies" className="rounded border border-navy px-4 py-2 text-sm">
            See agencies
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---------- Step 1: sales reps ---------- */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold">1. Sales reps</h2>
        <p className="text-sm text-gray-500">
          Who each rep in the report is in the CRM, and which office they work from. Their accounts are assigned to that person. Reps who
          aren&apos;t in the CRM yet can be added as new Sales users.
          <span className="mt-1 block">
            <strong>Offices:</strong> when an agency is looked after by reps in different offices, it&apos;s set up as one account per office -
            for example &quot;Omnicom Media Group SA JHB&quot; and &quot;Omnicom Media Group SA CPT&quot; - each with its own rep and clients.
            {splitAgencies > 0 ? ` ${splitAgencies} agency branches with an office right now.` : " Set offices to turn this on."}
          </span>
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="py-2 pr-3">In the report</th>
                <th className="py-2 pr-3 text-right">Net revenue</th>
                <th className="py-2 pr-3">Office</th>
                <th className="py-2">CRM user</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((r) => (
                <tr key={r.name} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-medium">{r.name}</td>
                  <td className="py-2 pr-3 text-right">{formatRandShort(r.total)}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={offices[r.name]}
                      onChange={(e) => setOffices({ ...offices, [r.name]: e.target.value as Office })}
                      className="rounded border border-gray-300 px-2 py-1.5"
                    >
                      <option value="">-</option>
                      {OFFICES.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <select
                      value={repMap[r.name]}
                      onChange={(e) => setRepMap({ ...repMap, [r.name]: e.target.value })}
                      className={`w-72 rounded border px-2 py-1.5 ${repMap[r.name] ? "border-gray-300" : "border-yellow bg-[#FFFBEB]"}`}
                    >
                      <option value="">Not linked - assign to me for now</option>
                      <option value="new">+ Add as a new Sales user</option>
                      <optgroup label="CRM users">
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    {!r.suggestion && repMap[r.name] === "new" && (
                      <span className="ml-2 text-xs text-gray-400">not in the CRM yet</span>
                    )}
                    {r.suggestion && repMap[r.name] === r.suggestion && userById.get(r.suggestion)?.name !== r.name && (
                      <span className="ml-2 text-xs text-gray-400">suggested - check it&apos;s the same person</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Step 2: accounts ---------- */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold">2. Accounts</h2>
        <p className="text-sm text-gray-500">
          Companies already in the CRM are matched automatically - check the ones marked &quot;close match&quot;. Everything else is
          created as a new account (tier and fiscal year set to To Be Assigned).
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 text-sm">
            {(
              [
                ["new", `New (${counts.new})`],
                ["match", `Matched (${counts.match})`],
                ["skip", `Skipped (${counts.skip})`],
                ["all", `All (${rows.length})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 ${tab === k ? "bg-navy text-white" : "border border-gray-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a company or rep..."
            className="w-56 rounded border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="mt-3 max-h-[70vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="py-2 pr-3">In the report</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Sales exec</th>
                <th className="py-2 pr-3 text-right">Net revenue</th>
                <th className="py-2">In the CRM</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const d = decisions[r.key];
                const execUser = r.rep && repMap[r.rep] && repMap[r.rep] !== "new" ? userById.get(repMap[r.rep])?.name : null;
                const current = d.accountId ? accountById.get(d.accountId) : null;
                return (
                  <tr key={r.key} className="border-b border-gray-100 align-top">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{r.name}</span>
                      {(r.aliases.length > 0 || r.agencyName) && (
                        <span className="block text-xs text-gray-400">
                          {r.agencyName && <>via {r.agencyName}</>}
                          {r.agencyName && r.aliases.length > 0 && " · "}
                          {r.aliases.length > 0 && <>also &quot;{r.aliases.slice(0, 2).join('", "')}&quot;</>}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={d.type}
                        disabled={d.action !== "create"}
                        onChange={(e) => setDecisions({ ...decisions, [r.key]: { ...d, type: e.target.value as Decision["type"] } })}
                        className="rounded border border-gray-300 px-2 py-1 disabled:border-transparent disabled:bg-transparent disabled:text-gray-500"
                      >
                        <option value="CLIENT">Client</option>
                        <option value="AGENCY">Agency</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3">
                      {r.rep ? (
                        <>
                          {execUser ?? (repMap[r.rep] === "new" ? `${r.rep} (new user)` : <span className="text-gray-400">{r.rep} - not linked</span>)}
                          {d.action === "match" && current && options.updateExec && execUser && current.exec !== execUser && (
                            <span className="block text-xs text-folly">was {current.exec}</span>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right">{r.total > 0 ? formatRandShort(r.total) : "-"}</td>
                    <td className="py-2">
                      <select
                        value={d.action === "match" ? d.accountId : d.action === "skip" ? "__skip" : "__create"}
                        onChange={(e) => setDecision(r.key, e.target.value)}
                        className={`w-64 rounded border px-2 py-1 ${d.action === "create" ? "border-teal" : d.action === "skip" ? "border-gray-300 text-gray-400" : "border-gray-300"}`}
                      >
                        <option value="__create">+ Create new account</option>
                        <option value="__skip">Skip - don&apos;t import</option>
                        {r.suggestion && accountById.get(r.suggestion.id) && (
                          <optgroup label="Suggested">
                            <option value={r.suggestion.id}>{accountById.get(r.suggestion.id)!.name}</option>
                          </optgroup>
                        )}
                        <optgroup label="All CRM accounts">
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                              {a.type === "AGENCY" ? " (agency)" : ""}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      {d.action === "match" && r.suggestion?.id === d.accountId && r.suggestion?.confidence === "close" && (
                        <span className="block text-xs text-[#B45309]">close match - please check</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    Nothing here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Step 3: options + apply ---------- */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold">3. Apply</h2>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={options.updateExec} onChange={(e) => setOptions({ ...options, updateExec: e.target.checked })} className="mt-1" />
            <span>
              <strong>Update the sales exec on existing accounts</strong> to the rep in the report (where the rep is linked above)
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={options.linkAgencies} onChange={(e) => setOptions({ ...options, linkAgencies: e.target.checked })} className="mt-1" />
            <span>
              <strong>Link clients to their media agency</strong> (only where a client has no agency set yet)
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={options.importSpend} onChange={(e) => setOptions({ ...options, importSpend: e.target.checked })} className="mt-1" />
            <span>
              <strong>Record monthly net revenue</strong> in each account&apos;s Spend history, including months already booked ahead.
              Running the import again replaces these months rather than adding them twice.
            </span>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button onClick={apply} disabled={busy} className="mt-5 rounded bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Importing... this can take a minute" : `Apply import: create ${counts.new}, update ${counts.match}`}
        </button>
      </section>
    </div>
  );
}

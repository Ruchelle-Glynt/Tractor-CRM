// Turning the sales report into import rows - shared by the review page (in
// the browser) and the import API (on the server), so both always agree.
// No data imports here; the report itself is loaded in lib/importer.ts.
import { companyKey } from "@/lib/names";

export const OFFICES = ["JHB", "CPT", "DBN", "GQ"] as const;
export type Office = (typeof OFFICES)[number] | "";

export type ReportAccount = {
  key: string;
  name: string;
  aliases: string[];
  type: "CLIENT" | "AGENCY";
  rep: string | null;
  agency: string | null; // agency name, for clients booked through one
  agencyRep: string | null; // the rep who handles this client through that agency
  repTotals: Record<string, number>; // agencies: revenue through them, per rep
  months: number[];
  total: number;
};

export type PlanRow = {
  key: string;
  name: string;
  aliases: string[];
  type: "CLIENT" | "AGENCY";
  rep: string | null;
  office: Office;
  agencyKey: string | null; // plan key of the agency (branch) this client goes through
  agencyName: string | null;
  months: number[];
  total: number;
};

// Agencies with reps in more than one office become one account per office
// ("Omnicom Media Group SA JHB", "Omnicom Media Group SA CPT"), each looked
// after by that office's rep. Reps without an office leave the agency whole.
export function buildPlan(accounts: ReportAccount[], offices: Record<string, Office>): PlanRow[] {
  const officeOf = (rep: string | null): Office => (rep ? offices[rep] ?? "" : "");
  const rows: PlanRow[] = [];
  const agencyBranches = new Map<string, Map<Office, string>>(); // agency name -> office -> plan key

  for (const a of accounts) {
    if (a.type !== "AGENCY") continue;
    const groups = new Map<Office, { reps: [string, number][]; total: number }>();
    const repEntries = Object.entries(a.repTotals ?? {});
    if (repEntries.length === 0 && a.rep) repEntries.push([a.rep, a.total]);
    for (const [rep, v] of repEntries) {
      const o = officeOf(rep);
      const g = groups.get(o) ?? { reps: [], total: 0 };
      g.reps.push([rep, v]);
      g.total += v;
      groups.set(o, g);
    }
    if (groups.size === 0) groups.set("", { reps: [], total: 0 });
    const split = groups.size > 1 || !groups.has("");
    const ordered = Array.from(groups.entries()).sort((x, y) => y[1].total - x[1].total);
    const branches = new Map<Office, string>();
    ordered.forEach(([office, g], i) => {
      const key = split ? `${a.key}|${office || "-"}` : a.key;
      // names that already carry an office ("PHD CPT") keep their name
      const hasOffice = OFFICES.some((o) => companyKey(a.name).endsWith(o));
      const suffix = split && office && !hasOffice ? ` ${office}` : "";
      branches.set(office, key);
      rows.push({
        key,
        name: `${a.name}${suffix}`,
        aliases: a.aliases.map((x) => `${x}${suffix}`),
        type: "AGENCY",
        rep: g.reps.sort((x, y) => y[1] - x[1])[0]?.[0] ?? a.rep,
        office: split ? office : "",
        agencyKey: null,
        agencyName: null,
        // any revenue billed to the agency itself goes to its biggest branch
        months: i === 0 ? a.months : a.months.map(() => 0),
        total: g.total + (i === 0 ? a.total : 0),
      });
    });
    agencyBranches.set(a.name, branches);
  }

  for (const a of accounts) {
    if (a.type !== "CLIENT") continue;
    let agencyKey: string | null = null;
    let agencyName: string | null = null;
    if (a.agency) {
      const branches = agencyBranches.get(a.agency);
      if (branches) {
        const o = officeOf(a.agencyRep ?? a.rep);
        agencyKey = branches.get(o) ?? Array.from(branches.values())[0] ?? null;
        agencyName = rows.find((r) => r.key === agencyKey)?.name ?? a.agency;
      }
    }
    rows.push({
      key: a.key,
      name: a.name,
      aliases: a.aliases,
      type: "CLIENT",
      rep: a.rep,
      office: officeOf(a.rep),
      agencyKey,
      agencyName,
      months: a.months,
      total: a.total,
    });
  }
  return rows;
}

// Best existing-account match for a plan row. Exact name (or alias) first;
// then one name starting with the other ("Havas" / "Havas Media").
export function suggestAccount(
  row: { name: string; aliases: string[]; office?: Office },
  existing: { id: string; name: string }[]
): { id: string; confidence: "exact" | "close" } | null {
  const keys = [row.name, ...row.aliases].map(companyKey).filter(Boolean);
  for (const e of existing) {
    if (keys.includes(companyKey(e.name))) return { id: e.id, confidence: "exact" };
  }
  const otherOffices = OFFICES.filter((o) => o !== row.office);
  let best: { id: string; score: number } | null = null;
  for (const e of existing) {
    const ek = companyKey(e.name);
    if (ek.length < 4) continue;
    // never suggest another office's branch
    if (row.office && otherOffices.some((o) => ek.endsWith(o))) continue;
    for (const k of keys) {
      if (k.length < 4) continue;
      if (k.startsWith(ek) || ek.startsWith(k)) {
        const score = Math.min(k.length, ek.length) / Math.max(k.length, ek.length);
        if (score >= 0.5 && (!best || score > best.score)) best = { id: e.id, score };
      }
    }
  }
  return best ? { id: best.id, confidence: "close" } : null;
}

const NICKNAMES: Record<string, string[]> = {
  MOLEBOGENG: ["MOLLY"],
  LAURENCE: ["LORRY", "LAWRENCE"],
  ANGELIQUE: ["ANG"],
  JOSHUA: ["JOSH"],
};

function nameParts(n: string) {
  return n
    .toUpperCase()
    .replace(/[^A-Z\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean);
}

// Suggest the CRM user for a sales rep name from the report.
export function suggestUser(rep: string, users: { id: string; name: string }[]): string | null {
  const rp = nameParts(rep);
  if (!rp.length) return null;
  const firsts = [rp[0], ...(NICKNAMES[rp[0]] ?? [])];
  const full = rp.join(" ");
  const exact = users.find((u) => nameParts(u.name).join(" ") === full);
  if (exact) return exact.id;
  const both = users.filter((u) => {
    const up = nameParts(u.name);
    return firsts.includes(up[0]) && up.slice(1).some((p) => rp.slice(1).includes(p));
  });
  if (both.length === 1) return both[0].id;
  const byFirst = users.filter((u) => firsts.includes(nameParts(u.name)[0]));
  if (byFirst.length === 1) return byFirst[0].id;
  return null;
}

export function monthToDate(m: string): Date {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1));
}

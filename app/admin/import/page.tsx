import { prisma } from "@/lib/prisma";
import NoPermission from "@/components/NoPermission";
import ImportReview from "@/components/ImportReview";
import { getCurrentUser } from "@/lib/permissions";
import { REPORT_ACCOUNTS, REPORT_MONTHS, REPORT_REPS, REPORT_SOURCE } from "@/lib/importer";
import { OFFICES, suggestUser, type Office } from "@/lib/importPlan";
import { companyKey } from "@/lib/names";

export const dynamic = "force-dynamic";

// Admin > Import: review the sales master report against the CRM before
// adding missing accounts, assigning sales execs and loading monthly spend.
export default async function ImportPage() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return <NoPermission backHref="/accounts" />;

  const [accounts, users] = await Promise.all([
    prisma.account.findMany({
      select: { id: true, name: true, type: true, salesExecutiveId: true, salesExecutive: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
  ]);

  // Guess each rep's office from the agency branches already in the CRM
  // ("Carat Cpt" looked after by Laurence -> Laurence is CPT).
  const officeVotes = new Map<string, Map<Office, number>>();
  for (const a of accounts) {
    const office = OFFICES.find((o) => companyKey(a.name).endsWith(o));
    if (!office || a.type !== "AGENCY") continue;
    const v = officeVotes.get(a.salesExecutiveId) ?? new Map<Office, number>();
    v.set(office, (v.get(office) ?? 0) + 1);
    officeVotes.set(a.salesExecutiveId, v);
  }

  const reps = REPORT_REPS.map((r) => {
    const suggestion = suggestUser(r.name, users);
    const votes = suggestion ? officeVotes.get(suggestion) : undefined;
    const office = votes ? Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0][0] : "";
    return { ...r, suggestion, office };
  });

  const first = REPORT_MONTHS[0];
  const last = REPORT_MONTHS[REPORT_MONTHS.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Import sales report</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">
          {REPORT_SOURCE}, {fmtMonth(first)} to {fmtMonth(last)}. Check how the sales reps and companies line up with the CRM below.
          Nothing changes until you press <strong>Apply import</strong>, and it&apos;s safe to run again.
        </p>
      </div>
      <ImportReview
        report={REPORT_ACCOUNTS}
        reps={reps}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, exec: a.salesExecutive.name }))}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}

function fmtMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-ZA", { month: "short", year: "numeric", timeZone: "UTC" });
}

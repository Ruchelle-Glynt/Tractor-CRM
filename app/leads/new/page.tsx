import { prisma } from "@/lib/prisma";
import NewLeadForm from "@/components/NewLeadForm";

// Always load fresh from the database - otherwise Next.js caches this page
// at deploy time and new leads/accounts don't show until the next deploy.
export const dynamic = "force-dynamic";

export default async function NewLeadPage({ searchParams }: { searchParams: { company?: string } }) {
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>New Lead</h1>
      <NewLeadForm users={users} accounts={accounts} defaultCompany={searchParams.company ?? ""} />
    </div>
  );
}

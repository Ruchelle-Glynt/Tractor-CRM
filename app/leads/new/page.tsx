import { prisma } from "@/lib/prisma";
import NewLeadForm from "@/components/NewLeadForm";

export default async function NewLeadPage() {
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>New Lead</h1>
      <NewLeadForm users={users} accounts={accounts} />
    </div>
  );
}

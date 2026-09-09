import { prisma } from "@/lib/prisma";
import NewAccountForm from "@/components/NewAccountForm";

export const dynamic = "force-dynamic";

export default async function NewAccountPage() {
  const [categories, salesUsers, agencies] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ mainCategory: "asc" }, { subcategory: "asc" }] }),
    prisma.user.findMany({ where: { role: "SALES" }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { type: "AGENCY" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New account</h1>
      <NewAccountForm
        categories={categories}
        users={salesUsers.map((u) => ({ id: u.id, label: u.name }))}
        agencies={agencies.map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditAccountForm from "@/components/EditAccountForm";

export default async function EditAccountPage({ params }: { params: { id: string } }) {
  const [account, categories, salesUsers, agencies] = await Promise.all([
    prisma.account.findUnique({
      where: { id: params.id },
      include: { category: true, subcategory: true },
    }),
    prisma.category.findMany({ orderBy: [{ mainCategory: "asc" }, { subcategory: "asc" }] }),
    prisma.user.findMany({ where: { role: "SALES" }, orderBy: { name: "asc" } }),
    prisma.account.findMany({ where: { type: "AGENCY" }, orderBy: { name: "asc" } }),
  ]);

  if (!account) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit account</h1>
      <EditAccountForm
        account={account}
        categories={categories}
        users={salesUsers.map((u) => ({ id: u.id, label: u.name }))}
        agencies={agencies.filter((a) => a.id !== account.id).map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}

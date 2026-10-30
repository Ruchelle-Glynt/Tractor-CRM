import { prisma } from "@/lib/prisma";
import { getCurrentUser, canEditAll } from "@/lib/permissions";
import NewContactForm from "@/components/NewContactForm";

export const dynamic = "force-dynamic";

export default async function NewContactPage({ searchParams }: { searchParams: { accountId?: string } }) {
  const user = await getCurrentUser();
  // Sales can only add contacts to their own accounts.
  const accounts = await prisma.account.findMany({
    where: canEditAll(user) ? {} : { salesExecutiveId: user?.id ?? "" },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New contact</h1>
      <NewContactForm
        accounts={accounts.map((a) => ({ id: a.id, label: a.name }))}
        defaultAccountId={searchParams.accountId}
      />
    </div>
  );
}

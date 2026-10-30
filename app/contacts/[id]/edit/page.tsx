import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditContactForm from "@/components/EditContactForm";
import NoPermission from "@/components/NoPermission";
import { getCurrentUser, canEditAccount, canEditAll } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const [contact, accounts] = await Promise.all([
    prisma.contact.findUnique({ where: { id: params.id }, include: { account: { select: { salesExecutiveId: true } } } }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!contact) notFound();
  const user = await getCurrentUser();
  if (!canEditAccount(user, contact.account)) return <NoPermission backHref={`/contacts/${contact.id}`} />;
  const { account: _account, ...contactFields } = contact;
  const movableTo = canEditAll(user) ? accounts : accounts.filter((a) => a.salesExecutiveId === user?.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit contact</h1>
      <EditContactForm
        contact={contactFields}
        accounts={movableTo.map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}

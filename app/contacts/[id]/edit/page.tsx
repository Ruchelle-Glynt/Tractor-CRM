import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditContactForm from "@/components/EditContactForm";

export const dynamic = "force-dynamic";

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const [contact, accounts] = await Promise.all([
    prisma.contact.findUnique({ where: { id: params.id } }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!contact) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Edit contact</h1>
      <EditContactForm
        contact={contact}
        accounts={accounts.map((a) => ({ id: a.id, label: a.name }))}
      />
    </div>
  );
}

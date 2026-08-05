import { prisma } from "@/lib/prisma";
import NewContactForm from "@/components/NewContactForm";

export default async function NewContactPage() {
  const accounts = await prisma.account.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">New contact</h1>
      <NewContactForm accounts={accounts.map((a) => ({ id: a.id, label: a.name }))} />
    </div>
  );
}

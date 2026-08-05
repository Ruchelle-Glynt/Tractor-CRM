import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ContactsListPage() {
  const contacts = await prisma.contact.findMany({
    include: { account: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Contacts</h1>
        <Link href="/contacts/new" className="rounded bg-navy px-4 py-2 text-sm text-white">
          + New contact
        </Link>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Title</th>
            <th className="py-2">Account</th>
            <th className="py-2">Birthday</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b border-gray-100 hover:bg-white">
              <td className="py-3">
                <Link href={`/contacts/${contact.id}`} className="font-medium text-navy hover:underline">
                  {contact.firstName} {contact.lastName}
                </Link>
              </td>
              <td className="py-3">{contact.title ?? "-"}</td>
              <td className="py-3">
                <Link href={`/accounts/${contact.accountId}`} className="text-navy hover:underline">
                  {contact.account.name}
                </Link>
              </td>
              <td className="py-3">
                {contact.birthday ? new Date(contact.birthday).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
          {contacts.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-400">
                No contacts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

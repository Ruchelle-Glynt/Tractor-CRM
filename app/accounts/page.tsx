import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Server component - reads straight from Prisma rather than calling our own
// API route, since this runs on the server anyway.
export default async function AccountsListPage() {
  const accounts = await prisma.account.findMany({
    include: { category: true, mainContact: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Accounts</h1>
        <Link href="/accounts/new" className="rounded bg-navy px-4 py-2 text-sm text-white">
          + New account
        </Link>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Type</th>
            <th className="py-2">Tier</th>
            <th className="py-2">Category</th>
            <th className="py-2">Main contact</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b border-gray-100 hover:bg-white">
              <td className="py-3">
                <Link href={`/accounts/${account.id}`} className="font-medium text-navy hover:underline">
                  {account.name}
                </Link>
              </td>
              <td className="py-3">{account.type}</td>
              <td className="py-3">{account.tier.replace("_", " ")}</td>
              <td className="py-3">{account.category?.mainCategory ?? "-"}</td>
              <td className="py-3">
                {account.mainContact ? `${account.mainContact.firstName} ${account.mainContact.lastName}` : "-"}
              </td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">
                No accounts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

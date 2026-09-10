import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar, TypeBadge, TierBadge } from "@/components/Badge";

// Always fetch fresh from the database - this page has no dynamic API calls
// of its own, so Next.js would otherwise treat it as static and cache it at
// build time, meaning edits (e.g. changing an account's type) wouldn't show
// up here until the next deploy.
export const dynamic = "force-dynamic";

// Server component - reads straight from Prisma rather than calling our own
// API route, since this runs on the server anyway.
export default async function AccountsListPage() {
  const accounts = await prisma.account.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Accounts</h1>
        <div className="flex gap-2">
          <a
            href="/api/accounts/export"
            className="rounded border border-navy px-4 py-2 text-sm text-navy"
          >
            Download CSV
          </a>
          <Link href="/accounts/new" className="rounded bg-navy px-4 py-2 text-sm text-white">
            + New account
          </Link>
        </div>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Type</th>
            <th className="py-2">Tier</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b border-gray-100 hover:bg-white">
              <td className="py-3">
                <Link href={`/accounts/${account.id}`} className="flex items-center gap-3 font-medium text-navy hover:underline">
                  <Avatar name={account.name} />
                  {account.name}
                </Link>
              </td>
              <td className="py-3">
                <TypeBadge type={account.type} />
              </td>
              <td className="py-3">
                <TierBadge tier={account.tier} />
              </td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-gray-400">
                No accounts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

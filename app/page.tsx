import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">
        Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="mt-2 text-gray-600">
        Signed in as {session?.user?.email} ({session?.user?.role})
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/accounts"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-teal"
        >
          <h2 className="text-lg font-semibold">Accounts</h2>
          <p className="mt-1 text-sm text-gray-600">
            Clients and agencies - tiering, team rosters, contracts, growth.
          </p>
        </Link>
        <Link
          href="/contacts"
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-teal"
        >
          <h2 className="text-lg font-semibold">Contacts</h2>
          <p className="mt-1 text-sm text-gray-600">
            Personal and relationship profiles for every client contact.
          </p>
        </Link>
      </div>
    </div>
  );
}

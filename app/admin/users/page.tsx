import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { photoSrc } from "@/lib/photo";
import NoPermission from "@/components/NoPermission";
import UsersAdmin from "@/components/UsersAdmin";

export const dynamic = "force-dynamic";

// Admin > Users
export default async function UsersPage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") return <NoPermission backHref="/profile" />;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      office: true,
      active: true,
      photoUpdatedAt: true,
      _count: { select: { salesAccounts: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[13px] text-gray-500">
          <Link href="/profile" className="hover:underline">
            Profile
          </Link>{" "}
          › Users
        </p>
        <h1 className="mt-1 text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Everyone who can sign in to the CRM. Admins can do everything; Sales can edit only their own accounts; Marketing can edit all
          accounts. Each person adds their own photo and details on their Profile page.
        </p>
      </div>
      <UsersAdmin
        meId={me.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          title: u.title,
          office: u.office,
          active: u.active,
          photo: photoSrc(u),
          accounts: u._count.salesAccounts,
        }))}
      />
    </div>
  );
}

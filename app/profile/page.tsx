import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { photoSrc } from "@/lib/photo";
import ProfileForm from "@/components/ProfileForm";
import PasswordForm from "@/components/PasswordForm";
import { UsersIcon, ChevronRightIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

// Your profile: photo, contact details and password.
export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { id: true, name: true, email: true, role: true, title: true, phone: true, office: true, photoUpdatedAt: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <ProfileForm
        profile={{
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          phone: user.phone,
          office: user.office,
          photo: photoSrc(user),
        }}
      />
      <PasswordForm />
      {user.role === "ADMIN" && (
        <Link href="/admin/users" className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm hover:ring-2 hover:ring-yellow">
          <UsersIcon />
          <span className="flex-1">
            <span className="block font-semibold">Manage users</span>
            <span className="block text-sm text-gray-500">Add people, change roles, reset passwords and deactivate leavers.</span>
          </span>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        </Link>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import QuickSearch from "@/components/QuickSearch";
import MobileMenu from "@/components/MobileMenu";
import { Avatar } from "@/components/Badge";
import {
  HomeIcon,
  BuildingIcon,
  BriefcaseIcon,
  UsersIcon,
  PulseIcon,
  GiftIcon,
  TargetIcon,
  ChartIcon,
  UserIcon,
  LogoutIcon,
  PlusIcon,
} from "@/components/Icons";

export const NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/accounts", label: "Accounts", Icon: BuildingIcon },
  { href: "/agencies", label: "Agencies", Icon: BriefcaseIcon },
  { href: "/contacts", label: "Contacts", Icon: UsersIcon },
  { href: "/activities", label: "Activity", Icon: PulseIcon },
  { href: "/gifts", label: "Gifts", Icon: GiftIcon },
  { href: "/leads", label: "Leads", Icon: TargetIcon },
  { href: "/market", label: "Market", Icon: ChartIcon },
];

// Pages that bring their own left-hand list panel and use the full width.
const FULL_WIDTH = ["/accounts", "/contacts"];

// The app frame: a black icon rail on the left (like Nimble's), a top bar with
// search and quick-add, and the page. The login page gets none of it.
export default function AppShell({
  user,
  children,
}: {
  user: { name: string; role: string; photo: string | null } | null;
  children: React.ReactNode;
}) {
  const userName = user?.name ?? null;
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/login")) return <>{children}</>;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const fullWidth = FULL_WIDTH.includes(pathname);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ---------- Icon rail ---------- */}
      <aside className="sticky top-0 hidden h-screen w-[68px] shrink-0 flex-col items-center bg-navy py-3 lg:flex">
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex w-[56px] flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
                isActive(href) ? "bg-yellow text-black" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center gap-1">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin/users"
              className={`flex w-[56px] flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium ${
                isActive("/admin/users") ? "bg-yellow text-black" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <UsersIcon />
              Users
            </Link>
          )}
          <Link
            href="/profile"
            className={`flex w-[56px] flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium ${
              isActive("/profile") ? "bg-yellow text-black" : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <UserIcon />
            Profile
          </Link>
          <Link
            href="/api/auth/signout"
            className="flex w-[56px] flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <LogoutIcon />
            Sign out
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---------- Top bar ---------- */}
        <header className="sticky top-0 z-30 bg-gray-100 px-3 pt-2.5 sm:px-4">
          <div className="relative flex items-center gap-3 rounded-xl bg-navy px-4 py-2 shadow-sm">
            <Link href="/" className="shrink-0">
              <Image src="/logo-white.jpg" alt="Tractor Outdoor" width={92} height={23} priority />
            </Link>
            <div className="ml-2 hidden flex-1 md:block">
              <QuickSearch wide />
            </div>
            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <div className="md:hidden">
                <QuickSearch />
              </div>
              <Link
                href="/leads/new"
                className="hidden items-center gap-1.5 rounded-md bg-yellow px-3 py-1.5 text-xs font-semibold text-black hover:brightness-95 sm:flex"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New lead
              </Link>
              {userName && (
                <Link href="/profile" className="ml-2 hidden items-center gap-2 text-[13px] font-medium text-white sm:flex" title="Your profile">
                  <span className="hidden xl:inline">{userName}</span>
                  <Avatar name={userName} src={user?.photo} size="h-7 w-7 text-xs" />
                </Link>
              )}
              <div className="lg:hidden">
                <MobileMenu
                  links={[...NAV.map(({ href, label }) => ({ href, label })), { href: "/profile", label: "Profile" }, ...(user?.role === "ADMIN" ? [{ href: "/admin/users", label: "Users" }] : [])]}
                />
              </div>
            </div>
          </div>
        </header>

        <main className={fullWidth ? "flex-1 p-3 sm:px-4" : "flex-1 px-4 py-6 sm:px-6"}>
          {fullWidth ? children : <div className="mx-auto max-w-6xl">{children}</div>}
        </main>
      </div>
    </div>
  );
}

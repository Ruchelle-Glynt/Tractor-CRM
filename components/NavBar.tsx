import Link from "next/link";
import Image from "next/image";
import QuickSearch from "@/components/QuickSearch";
import MobileMenu from "@/components/MobileMenu";

export const NAV_LINKS = [
  { href: "/accounts", label: "Accounts" },
  { href: "/agencies", label: "Agencies" },
  { href: "/contacts", label: "Contacts" },
  { href: "/activities", label: "Activity" },
  { href: "/gifts", label: "Gifts" },
  { href: "/leads", label: "Leads" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  return (
    <header className="relative bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/logo-white.jpg" alt="Tractor Outdoor" width={130} height={32} priority />
        </Link>
        <div className="flex items-center gap-5">
          <nav className="hidden gap-5 text-sm font-medium text-white lg:flex">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-yellow">
                {l.label}
              </Link>
            ))}
            <Link href="/api/auth/signout" className="hover:text-yellow">
              Sign out
            </Link>
          </nav>
          <QuickSearch />
          <MobileMenu links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}

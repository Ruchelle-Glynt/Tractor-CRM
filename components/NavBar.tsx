import Link from "next/link";
import Image from "next/image";
// Server component - just the shared top nav. Sign-out is a plain link to
// NextAuth's built-in /api/auth/signout page rather than a client component,
// to keep this file simple; swap in a proper button once more of the UI is styled.
export default function NavBar() {
  return (
    <header className="bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Image src="/logo-white.jpg" alt="Tractor Outdoor" width={130} height={32} priority />
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-white">
          <Link href="/accounts" className="hover:text-yellow">
            Accounts
          </Link>
          <Link href="/contacts" className="hover:text-yellow">
            Contacts
          </Link>
          <Link href="/contracts" className="hover:text-yellow">
            Contracts
          </Link>
          <Link href="/leads" className="hover:text-yellow">
            Leads
          </Link>
          <Link href="/settings" className="hover:text-yellow">
            Settings
          </Link>
          <Link href="/api/auth/signout" className="hover:text-yellow">
            Sign out
          </Link>
        </nav>
      </div>
    </header>
  );
}

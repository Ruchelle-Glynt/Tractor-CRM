import Link from "next/link";

// Server component - just the shared top nav. Sign-out is a plain link to
// NextAuth's built-in /api/auth/signout page rather than a client component,
// to keep this file simple; swap in a proper button once the UI is styled.
export default function NavBar() {
  return (
    <header className="border-b border-gray-200 bg-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-yellow">
          Tractor Outdoor CRM
        </Link>
        <nav className="flex gap-6 text-sm text-white">
          <Link href="/accounts">Accounts</Link>
          <Link href="/contacts">Contacts</Link>
          <Link href="/api/auth/signout">Sign out</Link>
        </nav>
      </div>
    </header>
  );
}

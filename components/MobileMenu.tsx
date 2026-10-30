"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu button for phones and small screens - the full menu doesn't fit there.
export default function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close after navigating
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/25 text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <nav className="absolute left-0 right-0 top-[64px] z-40 border-t border-white/10 bg-navy px-6 pb-4 shadow-lg">
          {[...links, { href: "/api/auth/signout", label: "Sign out" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block border-b border-white/10 py-3 text-base font-medium ${
                pathname === l.href ? "text-yellow" : "text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

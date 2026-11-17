import Link from "next/link";

export type PanelItem = {
  label: string;
  href: string;
  count?: number;
  active?: boolean;
  Icon?: (p: { className?: string }) => JSX.Element;
  dot?: string; // colour swatch instead of an icon
};
export type PanelSection = { heading?: string; items: PanelItem[] };

// Dark left-hand panel of saved views and segments (Accounts, Contacts),
// in the style of Nimble's contact list sidebar.
export default function ListPanel({ title, sections }: { title: string; sections: PanelSection[] }) {
  return (
    <>
    {/* Phones and small screens: the same views as a row of chips */}
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
      {sections.flatMap((s) => s.items).map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs ${it.active ? "bg-yellow font-semibold text-black" : "bg-navy text-gray-200"}`}
        >
          {it.label}
          {it.count !== undefined && <span className="ml-1.5 opacity-60">{it.count}</span>}
        </Link>
      ))}
    </div>
    <aside className="sticky top-[68px] hidden max-h-[calc(100vh-96px)] w-52 shrink-0 overflow-y-auto rounded-xl bg-[#141414] p-3 text-[13px] text-gray-300 lg:block">
      <h2 className="px-2 pb-2.5 pt-1 text-[15px] font-bold text-white">{title}</h2>
      {sections.map((s, i) => (
        <div key={i} className={i > 0 ? "mt-4" : ""}>
          {s.heading && <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{s.heading}</p>}
          <ul className="space-y-0.5">
            {s.items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 ${
                    it.active ? "bg-yellow font-semibold text-black" : "hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {it.Icon && <it.Icon className="h-[15px] w-[15px] shrink-0 opacity-80" />}
                  {it.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: it.dot }} />}
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.count !== undefined && (
                    <span className={`text-[11px] tabular-nums ${it.active ? "text-black/70" : "text-gray-500"}`}>{it.count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = { kind: string; id: string; title: string; subtitle: string; href: string };

const KIND_COLORS: Record<string, string> = {
  Account: "#04CA95",
  Agency: "#4C22F2",
  Contact: "#F7D849",
  Lead: "#FF005B",
};

// Search box in the nav bar. Opens with a click, Ctrl+K (Cmd+K on Mac) or "/".
export default function QuickSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else {
      setQ("");
      setResults([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(0);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function go(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      go(results[active]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-white/25 px-3 py-1.5 text-sm text-gray-300 hover:border-white hover:text-white"
        aria-label="Search"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded bg-white/10 px-1.5 text-[11px] font-medium sm:inline">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white text-gray-900 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-200 px-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search accounts, contacts and leads..."
                className="w-full py-4 text-base outline-none"
              />
              <kbd className="rounded border border-gray-200 px-1.5 text-[11px] text-gray-400">Esc</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Type at least 2 letters</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">
                  {loading ? "Searching..." : `Nothing found for "${q}"`}
                </p>
              ) : (
                <ul className="py-2">
                  {results.map((r, i) => (
                    <li key={`${r.kind}-${r.id}`}>
                      <button
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(r)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${i === active ? "bg-gray-100" : ""}`}
                      >
                        <span
                          className="w-16 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            backgroundColor: KIND_COLORS[r.kind],
                            color: r.kind === "Contact" ? "#000" : "#fff",
                          }}
                        >
                          {r.kind}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{r.title}</span>
                          {r.subtitle && <span className="block truncate text-xs text-gray-500">{r.subtitle}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

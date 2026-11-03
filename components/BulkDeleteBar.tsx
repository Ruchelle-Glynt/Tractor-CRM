"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Shown to Admins above the accounts table: tick accounts, then delete them
// in one go (handy for tidying up after an import).
export default function BulkDeleteBar() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>("input[data-bulk]"));
  const sync = () => setSelected(boxes().filter((b) => b.checked).map((b) => b.value));

  useEffect(() => {
    const onChange = (e: Event) => {
      if ((e.target as HTMLElement).matches?.("input[data-bulk]")) sync();
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, []);

  function setAll(checked: boolean) {
    boxes().forEach((b) => (b.checked = checked));
    sync();
  }

  async function remove() {
    const typed = window.prompt(
      `Permanently delete ${selected.length} ${selected.length === 1 ? "account" : "accounts"}, with their contacts, activity and spend history?\n\nType DELETE to confirm.`
    );
    if (typed?.trim().toUpperCase() !== "DELETE") return;
    setBusy(true);
    const res = await fetch("/api/accounts/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Couldn't delete these accounts.");
      return;
    }
    setAll(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <button onClick={() => setAll(selected.length === 0)} className="text-gray-500 hover:underline">
        {selected.length === 0 ? "Select all shown" : "Clear selection"}
      </button>
      {selected.length > 0 && (
        <>
          <span className="text-gray-600">{selected.length} selected</span>
          <button
            onClick={remove}
            disabled={busy}
            className="rounded border border-[#BE0044] px-3 py-1.5 font-semibold text-[#BE0044] hover:bg-[#BE0044] hover:text-white disabled:opacity-50"
          >
            {busy ? "Deleting..." : `Delete ${selected.length}`}
          </button>
        </>
      )}
    </div>
  );
}

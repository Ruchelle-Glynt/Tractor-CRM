"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// "Delete this account" box at the bottom of the Edit account page (Admins only).
export default function DeleteAccount({
  accountId,
  accountName,
  counts,
}: {
  accountId: string;
  accountName: string;
  counts: { contacts: number; activities: number; spendMonths: number; clients: number };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lost = [
    counts.contacts && `${counts.contacts} ${counts.contacts === 1 ? "contact" : "contacts"}`,
    counts.activities && `${counts.activities} logged ${counts.activities === 1 ? "activity" : "activities"}`,
    counts.spendMonths && `${counts.spendMonths} months of spend`,
  ].filter(Boolean) as string[];

  async function remove() {
    const typed = window.prompt(
      `This permanently deletes "${accountName}"${lost.length ? ` together with ${lost.join(", ")}` : ""}.` +
        (counts.clients ? `\n\nIts ${counts.clients} linked clients are kept, but no longer linked to this agency.` : "") +
        `\n\nType DELETE to confirm.`
    );
    if (typed?.trim().toUpperCase() !== "DELETE") return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't delete this account.");
      setBusy(false);
      return;
    }
    router.push("/accounts");
    router.refresh();
  }

  return (
    <section className="mt-12 max-w-xl rounded-xl border border-[#FFC2D6] bg-[#FFF5F8] p-5">
      <h2 className="text-base font-semibold text-[#BE0044]">Delete this account</h2>
      <p className="mt-1 text-sm text-gray-600">
        Removes the account for good{lost.length ? `, including ${lost.join(", ")}` : ""}. This can&apos;t be undone.
        {counts.clients > 0 && ` Its ${counts.clients} linked clients stay in the CRM.`}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={remove}
        disabled={busy}
        className="mt-4 rounded border border-[#BE0044] px-4 py-2 text-sm font-semibold text-[#BE0044] hover:bg-[#BE0044] hover:text-white disabled:opacity-50"
      >
        {busy ? "Deleting..." : "Delete account"}
      </button>
    </section>
  );
}

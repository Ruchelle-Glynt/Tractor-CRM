"use client";
import { useState } from "react";

// Change your own password (moved here from the old Settings page).
export default function PasswordForm() {
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setMsg({ ok: false, text: data.error ?? "Something went wrong." });
    else {
      setMsg({ ok: true, text: "Password updated." });
      setF({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  }

  const input = "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black";
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold">Password</h2>
      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          Current password
          <input type="password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} className={input} autoComplete="current-password" />
        </label>
        <label className="block text-sm font-medium">
          New password
          <input type="password" required minLength={8} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} className={input} autoComplete="new-password" />
        </label>
        <label className="block text-sm font-medium">
          Confirm new password
          <input type="password" required minLength={8} value={f.confirmPassword} onChange={(e) => setF({ ...f, confirmPassword: e.target.value })} className={input} autoComplete="new-password" />
        </label>
        <div className="flex items-center gap-3 sm:col-span-3">
          <button type="submit" disabled={busy} className="rounded-md border border-navy px-4 py-2 text-sm font-semibold hover:bg-navy hover:text-white disabled:opacity-50">
            {busy ? "Updating..." : "Update password"}
          </button>
          <span className="text-xs text-gray-400">At least 8 characters.</span>
          {msg && <span className={`text-sm ${msg.ok ? "text-[#037A5A]" : "text-red-600"}`}>{msg.text}</span>}
        </div>
      </form>
    </section>
  );
}

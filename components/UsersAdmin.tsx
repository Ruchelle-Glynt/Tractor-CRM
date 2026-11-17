"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Badge";

type U = {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
  office: string | null;
  active: boolean;
  photo: string | null;
  accounts: number;
};
const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "SALES", label: "Sales" },
  { value: "MARKETING", label: "Marketing" },
];
const OFFICES = ["JHB", "CPT", "DBN", "GQ"];

// Admin > Users: add people, change role / office, reset passwords and
// deactivate leavers.
export default function UsersAdmin({ users, meId }: { users: U[]; meId: string }) {
  const router = useRouter();
  const [list, setList] = useState(users);
  const [showAdd, setShowAdd] = useState(false);
  const [add, setAdd] = useState({ name: "", email: "", role: "SALES", office: "", title: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [login, setLogin] = useState<{ name: string; email: string; password: string; reset?: boolean } | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  async function change(id: string, data: Partial<U>) {
    setError(null);
    const prev = list;
    setList(list.map((u) => (u.id === id ? { ...u, ...data } : u)));
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setList(prev);
      setError((await res.json().catch(() => ({}))).error ?? "Couldn't save that change.");
    } else router.refresh();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(add),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't add that user.");
      return;
    }
    setLogin({ name: data.name, email: data.email, password: data.password });
    setList(
      [...list, { id: data.id, name: data.name, email: data.email, role: add.role, title: add.title || null, office: add.office || null, active: true, photo: null, accounts: 0 }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setAdd({ name: "", email: "", role: "SALES", office: "", title: "" });
    setShowAdd(false);
    router.refresh();
  }

  async function reset(u: U) {
    if (!window.confirm(`Give ${u.name} a new temporary password? Their current password will stop working.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}/reset-password`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? "Couldn't reset the password.");
    else setLogin({ ...data, reset: true });
  }

  function toggleActive(u: U) {
    if (u.active) {
      const note = u.accounts > 0 ? `\n\nThey still look after ${u.accounts} accounts - reassign those on the Accounts page.` : "";
      if (!window.confirm(`Deactivate ${u.name}? They won't be able to sign in. Their history stays in the CRM.${note}`)) return;
    }
    change(u.id, { active: !u.active });
  }

  const visible = list.filter((u) => showInactive || u.active);
  const inactiveCount = list.filter((u) => !u.active).length;
  const input = "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black";

  return (
    <div className="space-y-4">
      {login && (
        <div className="rounded-xl border border-yellow bg-[#FFFBEB] p-4 text-sm">
          <p className="font-semibold">
            {login.reset ? `New temporary password for ${login.name}` : `${login.name} has been added`} - share these login details privately. They&apos;re shown only once.
          </p>
          <p className="mt-2 font-mono">
            {login.email} &nbsp;·&nbsp; {login.password}
          </p>
          <p className="mt-1 text-xs text-gray-600">They should change the password on their Profile page after signing in.</p>
          <button onClick={() => setLogin(null)} className="mt-2 text-xs font-semibold underline">
            Done
          </button>
        </div>
      )}
      {error && <p className="rounded-lg bg-[#FFF5F8] px-4 py-2 text-sm text-[#BE0044]">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-md bg-navy px-4 py-2 text-[13px] font-semibold text-white">
          {showAdd ? "Cancel" : "+ Add user"}
        </button>
        {inactiveCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-black" />
            Show {inactiveCount} deactivated
          </label>
        )}
      </div>

      {showAdd && (
        <form onSubmit={create} className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-medium">
            Full name
            <input required value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input required type="email" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} placeholder="name@tractoroutdoor.com" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Role
            <select value={add.role} onChange={(e) => setAdd({ ...add, role: e.target.value })} className={input}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Office
            <select value={add.office} onChange={(e) => setAdd({ ...add, office: e.target.value })} className={input}>
              <option value="">Not set</option>
              {OFFICES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="w-full rounded-md bg-yellow px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {busy ? "Adding..." : "Add and create login"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-2 pl-4 pr-3">Person</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Office</th>
                <th className="py-2 pr-3 text-right">Accounts</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const me = u.id === meId;
                return (
                  <tr key={u.id} className={`border-t border-gray-100 ${u.active ? "" : "opacity-50"}`}>
                    <td className="py-2 pl-4 pr-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} src={u.photo} size="h-8 w-8 text-[13px]" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {u.name}
                            {me && <span className="ml-1.5 text-[11px] font-normal text-gray-400">(you)</span>}
                          </span>
                          <span className="block truncate text-[11px] text-gray-500">{[u.title, u.email].filter(Boolean).join(" · ")}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.role}
                        disabled={me}
                        onChange={(e) => change(u.id, { role: e.target.value })}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={u.office ?? ""}
                        onChange={(e) => change(u.id, { office: e.target.value || null })}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="">-</option>
                        {OFFICES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{u.accounts}</td>
                    <td className="py-2 pr-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={u.active ? { backgroundColor: "#D1FAE5", color: "#065F46" } : { backgroundColor: "#F3F4F6", color: "#6B7280" }}
                      >
                        {u.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-4 text-right text-xs">
                      <button onClick={() => reset(u)} className="text-gray-600 hover:underline">
                        Reset password
                      </button>
                      {!me && (
                        <button onClick={() => toggleActive(u)} className={`ml-3 hover:underline ${u.active ? "text-[#BE0044]" : "text-[#037A5A]"}`}>
                          {u.active ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { ACTIVITY_TYPES, activityLabel, formatRand } from "@/lib/activity";

export type ActivityItem = {
  id: string;
  type: string;
  description: string | null;
  activityDate: string;
  value: number | null;
  ownerId: string;
  owner: { name: string };
  contact: { id: string; firstName: string; lastName: string } | null;
};

type ContactOption = { id: string; firstName: string; lastName: string };

const TYPE_COLORS: Record<string, string> = {
  MEETING: "#4C22F2",
  CALL: "#04CA95",
  GIFT: "#FF005B",
  EVENT: "#F7D849",
  CAMPAIGN_DRIVE: "#000000",
  OTHER: "#9CA3AF",
};

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Activity log for one account (spec 4.4, Priority 6): gifts, events,
// campaign drives, calls and meetings, newest first.
export default function AccountActivities({
  accountId,
  contacts,
  initialActivities,
  currentUserId,
  isAdmin,
}: {
  accountId: string;
  contacts: ContactOption[];
  initialActivities: ActivityItem[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("MEETING");
  const [activityDate, setActivityDate] = useState(todayIso());
  const [contactId, setContactId] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType("MEETING");
    setActivityDate(todayIso());
    setContactId("");
    setDescription("");
    setValue("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/accounts/${accountId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, activityDate, contactId, description, value }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    const next = [{ ...data, activityDate: String(data.activityDate) }, ...activities].sort(
      (a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
    );
    setActivities(next);
    reset();
    setOpen(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this activity?")) return;
    const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
    if (res.ok) {
      setActivities(activities.filter((a) => a.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete.");
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Activity</h2>
        {!open && (
          <button onClick={() => setOpen(true)} className="rounded bg-navy px-4 py-2 text-sm text-white">
            + Log activity
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded border border-gray-200 bg-white p-4 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="font-medium">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-medium">Date</span>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                required
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-medium">Contact (optional)</span>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="">Whole account</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="font-medium">What happened</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Sent birthday hamper; lunch to discuss Q1 campaign"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block sm:w-1/3">
            <span className="font-medium">Value in rand (optional)</span>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 2500"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded bg-navy px-4 py-2 text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save activity"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="rounded border border-gray-300 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!open && error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {activities.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">No activity logged yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[a.type] ?? "#9CA3AF" }}
                />
                <div>
                  <p>
                    <span className="font-medium">{activityLabel(a.type)}</span>
                    {a.contact && (
                      <span className="text-gray-500">
                        {" "}
                        with{" "}
                        <a href={`/contacts/${a.contact.id}`} className="text-navy hover:underline">
                          {a.contact.firstName} {a.contact.lastName}
                        </a>
                      </span>
                    )}
                    {a.value !== null && <span className="text-gray-500"> · {formatRand(a.value)}</span>}
                  </p>
                  {a.description && <p className="mt-0.5 whitespace-pre-wrap text-gray-700">{a.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(a.activityDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}{" "}
                    · {a.owner.name}
                  </p>
                </div>
              </div>
              {(a.ownerId === currentUserId || isAdmin) && (
                <button onClick={() => handleDelete(a.id)} className="text-xs text-gray-400 hover:text-red-600">
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

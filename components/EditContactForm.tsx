"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Option = { id: string; label: string };
type ContactData = {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  decisionRole: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | Date | null;
  interests: string[];
  familyPetNotes: string | null;
  personalityNotes: string | null;
  giftPreferences: string | null;
  giftRestrictions: string | null;
};
export default function EditContactForm({ contact, accounts }: { contact: ContactData; accounts: Option[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const birthdayValue = contact.birthday ? new Date(contact.birthday).toISOString().slice(0, 10) : "";
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const interestsRaw = (form.get("interests") as string) ?? "";
    const payload = {
      accountId: form.get("accountId"),
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      title: form.get("title") || null,
      decisionRole: form.get("decisionRole") || null,
      email: form.get("email") || null,
      phone: form.get("phone") || null,
      birthday: form.get("birthday") || null,
      interests: interestsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      familyPetNotes: form.get("familyPetNotes") || null,
      personalityNotes: form.get("personalityNotes") || null,
      giftPreferences: form.get("giftPreferences") || null,
      giftRestrictions: form.get("giftRestrictions") || null,
    };
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong.");
      return;
    }
    router.push(`/contacts/${contact.id}`);
    router.refresh();
  }
  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">Account</label>
        <select
          name="accountId"
          required
          defaultValue={contact.accountId}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">First name</label>
          <input
            name="firstName"
            required
            defaultValue={contact.firstName}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Last name</label>
          <input
            name="lastName"
            required
            defaultValue={contact.lastName}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Title / designation</label>
          <input
            name="title"
            defaultValue={contact.title ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Decision role</label>
          <select
            name="decisionRole"
            defaultValue={contact.decisionRole ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Not set</option>
            <option value="DECISION_MAKER">Decision Maker</option>
            <option value="INFLUENCER">Influencer</option>
            <option value="ADMINISTRATIVE">Administrative</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            name="phone"
            defaultValue={contact.phone ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Birthday</label>
        <input
          name="birthday"
          type="date"
          defaultValue={birthdayValue}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Interests (comma-separated)</label>
        <input
          name="interests"
          defaultValue={contact.interests.join(", ")}
          placeholder="golf, wine, hiking"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Family & pet notes</label>
        <textarea
          name="familyPetNotes"
          defaultValue={contact.familyPetNotes ?? ""}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Who they are as people</label>
        <textarea
          name="personalityNotes"
          defaultValue={contact.personalityNotes ?? ""}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Gift preferences</label>
          <input
            name="giftPreferences"
            defaultValue={contact.giftPreferences ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Gift restrictions</label>
          <input
            name="giftRestrictions"
            defaultValue={contact.giftRestrictions ?? ""}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-navy px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

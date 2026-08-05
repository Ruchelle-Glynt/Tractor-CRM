"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };

export default function NewContactForm({ accounts }: { accounts: Option[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong.");
      return;
    }
    const created = await res.json();
    router.push(`/contacts/${created.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">Account</label>
        <select name="accountId" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
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
          <input name="firstName" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Last name</label>
          <input name="lastName" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Title / designation</label>
          <input name="title" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Decision role</label>
          <select name="decisionRole" className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
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
          <input name="email" type="email" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input name="phone" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Birthday</label>
        <input name="birthday" type="date" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Interests (comma-separated)</label>
        <input name="interests" placeholder="golf, wine, hiking" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Family & pet notes</label>
        <textarea name="familyPetNotes" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" rows={2} />
      </div>

      <div>
        <label className="block text-sm font-medium">Who they are as people</label>
        <textarea name="personalityNotes" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Gift preferences</label>
          <input name="giftPreferences" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Gift restrictions</label>
          <input name="giftRestrictions" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-navy px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Create contact"}
      </button>
    </form>
  );
}

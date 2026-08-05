"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };

export default function NewAccountForm({
  categories,
  users,
  agencies,
}: {
  categories: { id: string; mainCategory: string; subcategory: string | null }[];
  users: Option[];
  agencies: Option[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only top-level rows (subcategory === null) populate the Main Category
  // dropdown; subcategories for the chosen main category populate the second.
  const mainCategories = Array.from(new Set(categories.map((c) => c.mainCategory)));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const mainCategory = form.get("mainCategory") as string;
    const subcategoryName = form.get("subcategory") as string;

    const categoryRow = categories.find((c) => c.mainCategory === mainCategory && c.subcategory === null);
    const subcategoryRow = categories.find(
      (c) => c.mainCategory === mainCategory && c.subcategory === subcategoryName
    );

    const payload = {
      name: form.get("name"),
      type: form.get("type"),
      tier: form.get("tier"),
      fiscalYearStart: form.get("fiscalYearStart"),
      salesExecutiveId: form.get("salesExecutiveId"),
      parentAgencyId: form.get("parentAgencyId") || null,
      categoryId: categoryRow?.id ?? subcategoryRow?.id,
      subcategoryId: subcategoryRow?.id ?? null,
    };

    const res = await fetch("/api/accounts", {
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
    router.push(`/accounts/${created.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input name="name" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select name="type" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
            <option value="CLIENT">Client</option>
            <option value="AGENCY">Agency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Tier</label>
          <select name="tier" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
            <option value="TIER_1">Tier 1</option>
            <option value="TIER_2">Tier 2</option>
            <option value="TIER_3">Tier 3</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Parent agency (optional)</label>
        <select name="parentAgencyId" className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
          <option value="">None - direct account</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Main category</label>
          <select name="mainCategory" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
            {mainCategories.map((mc) => (
              <option key={mc} value={mc}>
                {mc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Subcategory (if any)</label>
          <input
            name="subcategory"
            list="subcategory-options"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Leave blank if none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Fiscal year</label>
        <select name="fiscalYearStart" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
          <option value="JAN_DEC">January - December</option>
          <option value="MAR_FEB">March - February</option>
          <option value="JUN_MAY">June - May</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Sales executive</label>
        <select name="salesExecutiveId" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <datalist id="subcategory-options">
        {categories
          .filter((c) => c.subcategory !== null)
          .map((c) => (
            <option key={c.id} value={c.subcategory ?? undefined} />
          ))}
      </datalist>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-navy px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Create account"}
      </button>
    </form>
  );
}

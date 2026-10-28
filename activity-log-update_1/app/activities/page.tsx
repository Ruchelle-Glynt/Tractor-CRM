import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_TYPES, activityLabel, formatRand } from "@/lib/activity";

export const dynamic = "force-dynamic";

const PERIODS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

// Activity log across every account (spec 4.4, Priority 6). New activities
// are logged from each account's page; this view is for looking back.
export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: { type?: string; owner?: string; period?: string };
}) {
  const type = ACTIVITY_TYPES.some((t) => t.value === searchParams.type) ? searchParams.type! : "";
  const owner = searchParams.owner ?? "";
  const period = PERIODS.some((p) => p.value === searchParams.period) ? searchParams.period! : "90";

  const where: Prisma.ActivityWhereInput = {};
  if (type) where.type = type as Prisma.ActivityWhereInput["type"];
  if (owner) where.ownerId = owner;
  if (period !== "all") {
    where.activityDate = { gte: new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000) };
  }

  const [activities, users] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { name: true } },
      },
      orderBy: { activityDate: "desc" },
      take: 500,
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalValue = activities.reduce((sum, a) => sum + (a.value === null ? 0 : Number(a.value)), 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Activity</h1>
        <p className="text-sm text-gray-500">Log new activity from an account&apos;s page.</p>
      </div>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 text-sm">
        <label className="block">
          <span className="text-gray-500">Type</span>
          <select name="type" defaultValue={type} className="mt-1 block rounded border border-gray-300 px-3 py-2">
            <option value="">All types</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-gray-500">Logged by</span>
          <select name="owner" defaultValue={owner} className="mt-1 block rounded border border-gray-300 px-3 py-2">
            <option value="">Everyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-gray-500">Period</span>
          <select name="period" defaultValue={period} className="mt-1 block rounded border border-gray-300 px-3 py-2">
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-navy px-4 py-2 text-white">
          Filter
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-500">
        {activities.length} {activities.length === 1 ? "activity" : "activities"}
        {totalValue > 0 && <> · {formatRand(totalValue)} total value</>}
      </p>

      {activities.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">No activity matches these filters.</p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Account</th>
              <th className="py-2 pr-3">Contact</th>
              <th className="py-2 pr-3">What happened</th>
              <th className="py-2 pr-3 text-right">Value</th>
              <th className="py-2">Logged by</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 align-top">
                <td className="whitespace-nowrap py-2 pr-3">
                  {a.activityDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="py-2 pr-3">{activityLabel(a.type)}</td>
                <td className="py-2 pr-3">
                  <Link href={`/accounts/${a.account.id}`} className="text-navy hover:underline">
                    {a.account.name}
                  </Link>
                </td>
                <td className="py-2 pr-3">
                  {a.contact ? (
                    <Link href={`/contacts/${a.contact.id}`} className="text-navy hover:underline">
                      {a.contact.firstName} {a.contact.lastName}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-2 pr-3 text-gray-700">{a.description ?? ""}</td>
                <td className="whitespace-nowrap py-2 pr-3 text-right">
                  {a.value === null ? "" : formatRand(Number(a.value))}
                </td>
                <td className="py-2">{a.owner.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

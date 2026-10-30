import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRand } from "@/lib/activity";
import { saToday, nextBirthday, shortDate, relativeDays } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

// Gift tracker: every gift logged (Activity type GIFT), spend per account,
// and upcoming birthdays showing who has / hasn't had a gift this year.
export default async function GiftsPage({ searchParams }: { searchParams: { year?: string } }) {
  const today = saToday();
  const thisYear = today.getUTCFullYear();
  const year = Number(searchParams.year) || thisYear;
  const yearStart = new Date(Date.UTC(year, 0, 1) - 2 * 60 * 60 * 1000);
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1) - 2 * 60 * 60 * 1000);

  const [gifts, birthdayContacts, firstGift] = await Promise.all([
    prisma.activity.findMany({
      where: { type: "GIFT", activityDate: { gte: yearStart, lt: yearEnd } },
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { name: true } },
      },
      orderBy: { activityDate: "desc" },
    }),
    prisma.contact.findMany({
      where: { birthday: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthday: true,
        giftPreferences: true,
        giftRestrictions: true,
        account: { select: { id: true, name: true } },
      },
    }),
    prisma.activity.findFirst({ where: { type: "GIFT" }, orderBy: { activityDate: "asc" }, select: { activityDate: true } }),
  ]);

  const totalSpend = gifts.reduce((s, g) => s + (g.value === null ? 0 : Number(g.value)), 0);
  const giftedContactIds = new Set(gifts.map((g) => g.contactId).filter(Boolean) as string[]);
  const pricedGifts = gifts.filter((g) => g.value !== null).length;

  // Spend per account
  const byAccount = new Map<string, { id: string; name: string; count: number; spend: number; last: Date }>();
  for (const g of gifts) {
    const row = byAccount.get(g.account.id) ?? { id: g.account.id, name: g.account.name, count: 0, spend: 0, last: g.activityDate };
    row.count += 1;
    row.spend += g.value === null ? 0 : Number(g.value);
    if (g.activityDate > row.last) row.last = g.activityDate;
    byAccount.set(g.account.id, row);
  }
  const accountRows = Array.from(byAccount.values()).sort((a, b) => b.spend - a.spend || b.count - a.count);
  const maxSpend = Math.max(1, ...accountRows.map((r) => r.spend));

  // Birthdays in the next 30 days, with whether they've had a gift this calendar year
  const giftedThisYear = year === thisYear ? giftedContactIds : new Set<string>();
  const upcoming = birthdayContacts
    .map((c) => ({ ...c, ...nextBirthday(c.birthday as Date, today) }))
    .filter((c) => c.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);

  const firstYear = firstGift ? firstGift.activityDate.getUTCFullYear() : thisYear;
  const years: number[] = [];
  for (let y = thisYear; y >= Math.min(firstYear, thisYear); y--) years.push(y);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Gifts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Log a gift from an account&apos;s page: + Log activity, type Gift.
          </p>
        </div>
        <form method="get" className="flex items-center gap-2 text-sm">
          <select name="year" defaultValue={String(year)} className="rounded border border-gray-300 px-3 py-2">
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded bg-navy px-4 py-2 text-white">
            Show
          </button>
        </form>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile color="#FF005B" label={`Gifts in ${year}`} value={gifts.length.toLocaleString("en-ZA")} />
        <Tile color="#F7D849" label="Total spend" value={formatRand(totalSpend) || "R0"} />
        <Tile color="#04CA95" label="People gifted" value={giftedContactIds.size.toLocaleString("en-ZA")} />
        <Tile
          color="#4C22F2"
          label="Average gift"
          value={pricedGifts > 0 ? formatRand(Math.round(totalSpend / pricedGifts)) : "-"}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Upcoming birthdays */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold">Birthdays in the next 30 days</h2>
          <p className="text-sm text-gray-500">And whether they&apos;ve had a gift from us this year</p>
          {upcoming.length === 0 ? (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">No birthdays coming up.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {upcoming.map((c) => {
                const gifted = giftedThisYear.has(c.id);
                return (
                  <li key={c.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/contacts/${c.id}`} className="truncate text-sm font-medium hover:underline">
                        {c.firstName} {c.lastName}
                      </Link>
                      <span className="shrink-0 text-xs text-gray-500">
                        {shortDate(c.date)} · {relativeDays(c.daysAway).toLowerCase()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <Link href={`/accounts/${c.account.id}`} className="truncate text-xs text-gray-500 hover:underline">
                        {c.account.name}
                      </Link>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={gifted ? { backgroundColor: "#D1FAE5", color: "#065F46" } : { backgroundColor: "#F3F4F6", color: "#374151" }}
                      >
                        {gifted ? "Gifted this year" : "No gift yet"}
                      </span>
                    </div>
                    {(c.giftPreferences || c.giftRestrictions) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {c.giftPreferences && <>Likes: {c.giftPreferences}</>}
                        {c.giftPreferences && c.giftRestrictions && " · "}
                        {c.giftRestrictions && <span className="text-folly">Avoid: {c.giftRestrictions}</span>}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Spend by account */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-3">
          <h2 className="text-lg font-bold">Spend by account</h2>
          <p className="text-sm text-gray-500">Gifts logged in {year}, biggest spend first</p>
          {accountRows.length === 0 ? (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">No gifts logged in {year}.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {accountRows.slice(0, 15).map((r) => (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/accounts/${r.id}`} className="truncate font-medium hover:underline">
                      {r.name}
                    </Link>
                    <span className="shrink-0 text-gray-500">
                      {r.count} {r.count === 1 ? "gift" : "gifts"} · <span className="font-semibold text-gray-900">{formatRand(r.spend) || "R0"}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-folly" style={{ width: `${Math.max(3, (r.spend / maxSpend) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* All gifts */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">Every gift in {year}</h2>
        {gifts.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Nothing logged yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-gray-500">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">For</th>
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">What</th>
                  <th className="py-2 pr-3 text-right">Value</th>
                  <th className="py-2">Sent by</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.id} className="border-b border-gray-100 align-top">
                    <td className="whitespace-nowrap py-2 pr-3">{shortDate(g.activityDate)}</td>
                    <td className="py-2 pr-3">
                      {g.contact ? (
                        <Link href={`/contacts/${g.contact.id}`} className="hover:underline">
                          {g.contact.firstName} {g.contact.lastName}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Whole account</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <Link href={`/accounts/${g.account.id}`} className="hover:underline">
                        {g.account.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-gray-700">{g.description ?? ""}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right">{g.value === null ? "" : formatRand(Number(g.value))}</td>
                    <td className="py-2">{g.owner.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 font-heading text-3xl font-black">{value}</p>
    </div>
  );
}

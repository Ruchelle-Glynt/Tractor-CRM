import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, TierBadge } from "@/components/Badge";
import HealthPill from "@/components/HealthPill";
import { healthFor, lastActivityByAccount } from "@/lib/health";
import { activityLabel, formatRand } from "@/lib/activity";
import {
  saToday,
  saMonthStart,
  greeting,
  nextBirthday,
  nextFiscalStart,
  FISCAL_START_MONTH,
  daysAgo,
  relativeDays,
  shortDate,
} from "@/lib/dashboard";

// Home dashboard - always loaded fresh so the numbers are live.
export const dynamic = "force-dynamic";

const ACCENTS = ["#04CA95", "#4C22F2", "#FF005B", "#F7D849"];
const ACTIVITY_COLORS: Record<string, string> = {
  MEETING: "#4C22F2",
  CALL: "#04CA95",
  GIFT: "#FF005B",
  EVENT: "#F7D849",
  CAMPAIGN_DRIVE: "#000000",
  OTHER: "#9CA3AF",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null; role?: string } | undefined;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const today = saToday();
  const monthStart = saMonthStart(today);
  const lastMonthStart = saMonthStart(today, 1);

  const [
    totalAccounts,
    myAccounts,
    activitiesThisMonth,
    activitiesLastMonth,
    leaderboardRows,
    recentActivities,
    openLeadCount,
    newLeads,
    birthdayContacts,
    fiscalAccounts,
    users,
  ] = await Promise.all([
    prisma.account.count(),
    user?.id ? prisma.account.count({ where: { salesExecutiveId: user.id } }) : Promise.resolve(0),
    prisma.activity.count({ where: { activityDate: { gte: monthStart } } }),
    prisma.activity.count({ where: { activityDate: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.activity.groupBy({
      by: ["ownerId"],
      where: { activityDate: { gte: monthStart } },
      _count: { _all: true },
    }),
    prisma.activity.findMany({
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { name: true } },
      },
      orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
      take: 7,
    }),
    prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED"] } } }),
    prisma.lead.findMany({
      where: { status: "NEW" },
      include: { transferredToUser: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 5,
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
    prisma.account.findMany({
      where: { fiscalYearStart: { in: ["JAN_DEC", "MAR_FEB", "JUN_MAY"] } },
      select: { id: true, name: true, fiscalYearStart: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ]);

  // Going cold: Tier 1 and 2 accounts with nothing logged in 60+ days (or
  // never). Sales see their own accounts; everyone else sees the whole book.
  const keyAccounts = await prisma.account.findMany({
    where: {
      tier: { in: ["TIER_1", "TIER_2"] },
      ...(user?.role === "SALES" && user.id ? { salesExecutiveId: user.id } : {}),
    },
    select: { id: true, name: true, tier: true, salesExecutive: { select: { name: true } } },
  });
  const lastActivity = await lastActivityByAccount(keyAccounts.map((a) => a.id));
  const goingCold = keyAccounts
    .map((a) => ({ ...a, health: healthFor(lastActivity.get(a.id)) }))
    .filter((a) => a.health.status !== "ACTIVE")
    .sort(
      (a, b) =>
        a.tier.localeCompare(b.tier) || (b.health.daysSince ?? 100000) - (a.health.daysSince ?? 100000) || a.name.localeCompare(b.name)
    );

  // Birthdays in the next 30 days, soonest first.
  const birthdays = birthdayContacts
    .map((c) => ({ ...c, ...nextBirthday(c.birthday as Date, today) }))
    .filter((c) => c.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway || a.firstName.localeCompare(b.firstName));
  const birthdaysThisWeek = birthdays.filter((b) => b.daysAway <= 7).length;
  const birthdaysToday = birthdays.filter((b) => b.daysAway === 0);

  // Leaderboard: activities logged this month, per person.
  const userNames = new Map(users.map((u) => [u.id, u.name]));
  const leaderboard = leaderboardRows
    .map((r) => ({ id: r.ownerId, name: userNames.get(r.ownerId) ?? "Unknown", count: r._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const topCount = leaderboard[0]?.count ?? 0;

  // Fiscal years starting in the next ~3 months - time for budget conversations.
  const budgetSeason = Object.entries(FISCAL_START_MONTH)
    .map(([key, info]) => {
      const accounts = fiscalAccounts.filter((a) => a.fiscalYearStart === key);
      return { key, label: info.label, accounts, ...nextFiscalStart(info.month, today) };
    })
    .filter((f) => f.accounts.length > 0 && f.daysAway <= 92)
    .sort((a, b) => a.daysAway - b.daysAway);

  const activityDelta = activitiesThisMonth - activitiesLastMonth;
  const monthName = today.toLocaleDateString("en-ZA", { month: "long", timeZone: "UTC" });
  const lastMonthName = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)).toLocaleDateString(
    "en-ZA",
    { month: "short", timeZone: "UTC" }
  );

  // One-line summary for the banner.
  const headlineBits: string[] = [];
  if (birthdaysToday.length > 0) {
    headlineBits.push(
      birthdaysToday.length === 1
        ? `it's ${birthdaysToday[0].firstName} ${birthdaysToday[0].lastName}'s birthday today`
        : `${birthdaysToday.length} birthdays today`
    );
  } else if (birthdaysThisWeek > 0) {
    headlineBits.push(`${birthdaysThisWeek} ${birthdaysThisWeek === 1 ? "birthday" : "birthdays"} this week`);
  }
  if (newLeads.length > 0) headlineBits.push(`${newLeads.length} new ${newLeads.length === 1 ? "lead" : "leads"} waiting`);
  headlineBits.push(
    activitiesThisMonth > 0
      ? `${activitiesThisMonth} ${activitiesThisMonth === 1 ? "activity" : "activities"} logged in ${monthName}`
      : `a fresh month of activity to log`
  );
  const headline =
    headlineBits.length > 1
      ? `${headlineBits.slice(0, -1).join(", ")} and ${headlineBits[headlineBits.length - 1]}.`
      : `${headlineBits[0]}.`;

  return (
    <div className="space-y-8">
      {/* ---------- Header ---------- */}
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {today.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.6rem]">
            {greeting()},{" "}
            <span className="bg-[linear-gradient(transparent_62%,#F7D849_62%)]">{firstName}.</span>
          </h1>
          <p className="mt-3 text-[15px] text-gray-600">{headline.charAt(0).toUpperCase() + headline.slice(1)}</p>
        </div>
        <div className="flex shrink-0 gap-2 text-[13px] font-semibold">
          <Link href="/leads/new" className="whitespace-nowrap rounded-md bg-navy px-3.5 py-2 text-white hover:bg-gray-800">
            + New lead
          </Link>
          <Link href="/accounts/new" className="whitespace-nowrap rounded-md border border-navy px-3.5 py-2 hover:bg-navy hover:text-white">
            + Account
          </Link>
          <Link href="/contacts/new" className="whitespace-nowrap rounded-md border border-navy px-3.5 py-2 hover:bg-navy hover:text-white">
            + Contact
          </Link>
        </div>
      </section>

      {/* ---------- Stat tiles ---------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          color="#04CA95"
          label={user?.role === "SALES" ? "Your accounts" : "Accounts"}
          value={user?.role === "SALES" ? myAccounts : totalAccounts}
          note={user?.role === "SALES" ? `of ${totalAccounts} in the CRM` : myAccounts > 0 ? `${myAccounts} are yours` : "across the team"}
          href="/accounts"
        />
        <StatTile
          color="#4C22F2"
          label={`Activity in ${monthName}`}
          value={activitiesThisMonth}
          note={
            activityDelta > 0
              ? `▲ ${activityDelta} more than ${lastMonthName}`
              : activityDelta < 0
              ? `▼ ${Math.abs(activityDelta)} fewer than ${lastMonthName}`
              : `Same as ${lastMonthName}`
          }
          noteColor={activityDelta > 0 ? "#04CA95" : activityDelta < 0 ? "#FF005B" : undefined}
          href="/activities?period=30"
        />
        <StatTile
          color="#FF005B"
          label="Open leads"
          value={openLeadCount}
          note={newLeads.length > 0 ? `${newLeads.length} not contacted yet` : "All contacted"}
          href="/leads"
        />
        <StatTile
          color="#F7D849"
          label="Birthdays this week"
          value={birthdaysThisWeek}
          note={`${birthdays.length} in the next 30 days`}
          href="#birthdays"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------- Left column ---------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Birthdays */}
          <Card id="birthdays" title="Birthdays coming up" subtitle="Next 30 days - a good moment for a gift or a call">
            {birthdays.length === 0 ? (
              <Empty>No birthdays in the next 30 days.</Empty>
            ) : (
              <ul className="divide-y divide-gray-100">
                {birthdays.slice(0, 8).map((b, i) => (
                  <li key={b.id} className="flex items-center gap-4 py-3">
                    <CalendarChip date={b.date} color={ACCENTS[i % ACCENTS.length]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        <Link href={`/contacts/${b.id}`} className="hover:underline">
                          {b.firstName} {b.lastName}
                        </Link>
                        <span className="font-normal text-gray-400"> · </span>
                        <Link href={`/accounts/${b.account.id}`} className="font-normal text-gray-500 hover:underline">
                          {b.account.name}
                        </Link>
                      </p>
                      {(b.giftPreferences || b.giftRestrictions) && (
                        <p className="truncate text-xs text-gray-500">
                          {b.giftPreferences && <>Likes: {b.giftPreferences}</>}
                          {b.giftPreferences && b.giftRestrictions && " · "}
                          {b.giftRestrictions && <span className="text-folly">Avoid: {b.giftRestrictions}</span>}
                        </p>
                      )}
                    </div>
                    <CountdownPill days={b.daysAway} />
                  </li>
                ))}
              </ul>
            )}
            {birthdays.length > 8 && (
              <p className="mt-3 text-xs text-gray-400">+ {birthdays.length - 8} more later this month</p>
            )}
          </Card>

          {/* Recent activity */}
          <Card
            title="Latest activity"
            subtitle="What the team has been up to"
            action={
              <Link href="/activities" className="text-sm font-medium text-navy hover:underline">
                See all →
              </Link>
            }
          >
            {recentActivities.length === 0 ? (
              <Empty>Nothing logged yet. Open any account and hit &quot;+ Log activity&quot; to get things going.</Empty>
            ) : (
              <ol className="relative ml-1 border-l-2 border-gray-100">
                {recentActivities.map((a) => (
                  <li key={a.id} className="relative pb-4 pl-5 last:pb-0">
                    <span
                      className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white"
                      style={{ backgroundColor: ACTIVITY_COLORS[a.type] ?? "#9CA3AF" }}
                    />
                    <p className="text-sm">
                      <span className="font-semibold">{a.owner.name.split(" ")[0]}</span>{" "}
                      <span className="text-gray-500">logged {/^[aeiou]/i.test(activityLabel(a.type)) ? "an" : "a"}</span>{" "}
                      <span className="font-medium">{activityLabel(a.type).toLowerCase()}</span>{" "}
                      <span className="text-gray-500">with</span>{" "}
                      <Link href={`/accounts/${a.account.id}`} className="font-medium hover:underline">
                        {a.account.name}
                      </Link>
                      {a.contact && (
                        <span className="text-gray-500">
                          {" "}
                          ({a.contact.firstName} {a.contact.lastName})
                        </span>
                      )}
                      {a.value !== null && <span className="text-gray-500"> · {formatRand(Number(a.value))}</span>}
                    </p>
                    {a.description && <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{a.description}</p>}
                    <p className="mt-0.5 text-xs text-gray-400">{shortDate(a.activityDate)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* ---------- Right column ---------- */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card title={`${monthName} leaderboard`} subtitle="Activities logged this month">
            {leaderboard.length === 0 ? (
              <Empty>The board is empty. First activity logged takes the top spot.</Empty>
            ) : (
              <ul className="space-y-3">
                {leaderboard.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="w-4 text-right text-sm font-bold text-gray-400">{i + 1}</span>
                    <Avatar name={p.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {p.name}
                          {i === 0 && (
                            <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                              Leading
                            </span>
                          )}
                        </span>
                        <span className="text-sm font-bold">{p.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.max(6, (p.count / topCount) * 100)}%`,
                            backgroundColor: ACCENTS[i % ACCENTS.length],
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Going cold */}
          <Card
            title="Going cold"
            subtitle={`Tier 1 & 2 ${user?.role === "SALES" ? "accounts of yours " : ""}with nothing logged in 60+ days`}
            action={
              <Link href="/accounts?health=COLD" className="text-sm font-medium text-navy hover:underline">
                All →
              </Link>
            }
          >
            {goingCold.length === 0 ? (
              <Empty>Every key account has had attention in the last 60 days. Nice work.</Empty>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {goingCold.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link href={`/accounts/${a.id}`} className="block truncate text-sm font-medium hover:underline">
                          {a.name}
                        </Link>
                        <p className="flex items-center gap-2 text-xs text-gray-400">
                          <TierBadge tier={a.tier} />
                          {a.salesExecutive.name.split(" ")[0]}
                        </p>
                      </div>
                      <HealthPill health={a.health} />
                    </li>
                  ))}
                </ul>
                {goingCold.length > 6 && (
                  <p className="mt-3 text-xs text-gray-400">+ {goingCold.length - 6} more key accounts need attention</p>
                )}
              </>
            )}
          </Card>

          {/* Leads waiting */}
          <Card
            title="Leads waiting"
            subtitle="New and not contacted yet, oldest first"
            action={
              <Link href="/leads" className="text-sm font-medium text-navy hover:underline">
                All →
              </Link>
            }
          >
            {newLeads.length === 0 ? (
              <Empty>Inbox zero - every lead has been contacted.</Empty>
            ) : (
              <ul className="divide-y divide-gray-100">
                {newLeads.map((l) => {
                  const age = daysAgo(l.createdAt);
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link href={`/leads/${l.id}`} className="block truncate text-sm font-medium hover:underline">
                          {l.contactName}
                          {l.companyName && <span className="font-normal text-gray-500"> · {l.companyName}</span>}
                        </Link>
                        <p className="text-xs text-gray-400">With {l.transferredToUser.name.split(" ")[0]}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={
                          age >= 3
                            ? { backgroundColor: "#FF005B", color: "#fff" }
                            : { backgroundColor: "#F3F4F6", color: "#374151" }
                        }
                      >
                        {age === 0 ? "Today" : `${age}d`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Budget season */}
          <Card title="Budget season" subtitle="Fiscal years starting in the next 3 months">
            {budgetSeason.length === 0 ? (
              <Empty>No client fiscal years start in the next 3 months.</Empty>
            ) : (
              <ul className="space-y-4">
                {budgetSeason.map((f) => (
                  <li key={f.key}>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-semibold">
                        {f.label} · starts {shortDate(f.date)}
                      </p>
                      <span className="text-xs text-gray-500">{relativeDays(f.daysAway).toLowerCase()}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {f.accounts.slice(0, 4).map((a, i) => (
                        <span key={a.id}>
                          {i > 0 && ", "}
                          <Link href={`/accounts/${a.id}`} className="hover:underline">
                            {a.name}
                          </Link>
                        </span>
                      ))}
                      {f.accounts.length > 4 && <span className="text-gray-400"> + {f.accounts.length - 4} more</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function StatTile({
  color,
  label,
  value,
  note,
  noteColor,
  href,
}: {
  color: string;
  label: string;
  value: number;
  note: string;
  noteColor?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold">{value.toLocaleString("en-ZA")}</p>
      <p className="mt-1 text-xs font-medium" style={{ color: noteColor ?? "#6B7280" }}>
        {note}
      </p>
    </Link>
  );
}

function Card({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">{children}</p>;
}

function CalendarChip({ date, color }: { date: Date; color: string }) {
  const dark = color === "#F7D849";
  return (
    <div className="w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 text-center">
      <div
        className="py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: color, color: dark ? "#000" : "#fff" }}
      >
        {date.toLocaleDateString("en-ZA", { month: "short", timeZone: "UTC" })}
      </div>
      <div className="py-1 font-heading text-base font-bold leading-none">{date.getUTCDate()}</div>
    </div>
  );
}

function CountdownPill({ days }: { days: number }) {
  const style =
    days === 0
      ? { backgroundColor: "#FF005B", color: "#fff" }
      : days === 1
      ? { backgroundColor: "#F7D849", color: "#000" }
      : days <= 7
      ? { backgroundColor: "#000", color: "#fff" }
      : { backgroundColor: "#F3F4F6", color: "#374151" };
  return (
    <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold" style={style}>
      {relativeDays(days)}
    </span>
  );
}

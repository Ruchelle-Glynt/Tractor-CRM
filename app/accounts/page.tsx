import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Badge";
import HealthPill from "@/components/HealthPill";
import BulkDeleteBar from "@/components/BulkDeleteBar";
import ListPanel, { type PanelSection } from "@/components/ListPanel";
import InlineSelect from "@/components/InlineSelect";
import { BuildingIcon, BriefcaseIcon, ListIcon, UserIcon, SnowIcon, ClockIcon, PlusIcon, DownloadIcon, UploadIcon, ChevronRightIcon } from "@/components/Icons";
import { healthFor, lastActivityByAccount } from "@/lib/health";
import { getCurrentUser, canEditAccount } from "@/lib/permissions";
import { photoSrc } from "@/lib/photo";

// Always fetch fresh from the database - otherwise Next.js caches this page
// at deploy time and edits don't show until the next deploy.
export const dynamic = "force-dynamic";

const TIERS = [
  { value: "TIER_1", label: "Tier 1", color: "#FF005B", text: "#fff" },
  { value: "TIER_2", label: "Tier 2", color: "#F7D849", text: "#000" },
  { value: "TIER_3", label: "Tier 3", color: "#04CA95", text: "#fff" },
  { value: "TO_BE_ASSIGNED", label: "To be assigned", color: "#E5E7EB", text: "#374151" },
];
const TIER_TONE = Object.fromEntries(TIERS.map((t) => [t.value, { bg: t.color, text: t.text }]));
const TYPE_TONE = { CLIENT: { bg: "#E6FAF4", text: "#037A5A" }, AGENCY: { bg: "#EEEAFE", text: "#4C22F2" } };

type Params = { q?: string; type?: string; tier?: string; exec?: string; health?: string };

// Accounts list: dark panel of views on the left (all, clients, agencies,
// going cold, by tier, by sales exec), the table on the right with tier and
// sales exec editable in place.
export default async function AccountsListPage({ searchParams }: { searchParams: Params }) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const q = searchParams.q?.trim() ?? "";
  const type = ["CLIENT", "AGENCY"].includes(searchParams.type ?? "") ? searchParams.type! : "";
  const tier = TIERS.some((t) => t.value === searchParams.tier) ? searchParams.tier! : "";
  const exec = searchParams.exec ?? "";
  const health = ["ACTIVE", "COOLING", "COLD", "NONE"].includes(searchParams.health ?? "") ? searchParams.health! : "";

  const [all, users, lastActivity] = await Promise.all([
    prisma.account.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        tier: true,
        salesExecutiveId: true,
        salesExecutive: { select: { id: true, name: true, photoUpdatedAt: true } },
        category: { select: { mainCategory: true } },
        parentAgency: { select: { name: true } },
        _count: { select: { clients: true, contacts: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
    lastActivityByAccount(),
  ]);

  const withHealth = all.map((a) => ({ ...a, health: healthFor(lastActivity.get(a.id)) }));
  const execId = exec === "me" ? user?.id ?? "" : exec;
  const rows = withHealth.filter(
    (a) =>
      (!q || a.name.toLowerCase().includes(q.toLowerCase())) &&
      (!type || a.type === type) &&
      (!tier || a.tier === tier) &&
      (!execId || a.salesExecutiveId === execId) &&
      (!health || a.health.status === health)
  );

  // ---- Left panel ----
  const count = (f: (a: (typeof withHealth)[number]) => boolean) => withHealth.filter(f).length;
  const noFilter = !type && !tier && !exec && !health;
  const mine = user ? count((a) => a.salesExecutiveId === user.id) : 0;
  const execs = users
    .map((u) => ({ ...u, n: count((a) => a.salesExecutiveId === u.id) }))
    .filter((u) => u.n > 0)
    .sort((a, b) => b.n - a.n);
  const sections: PanelSection[] = [
    {
      items: [
        { label: "All accounts", href: "/accounts", count: all.length, active: noFilter, Icon: ListIcon },
        ...(mine > 0 ? [{ label: "My accounts", href: "/accounts?exec=me", count: mine, active: exec === "me" && !type && !tier && !health, Icon: UserIcon }] : []),
        { label: "Clients", href: "/accounts?type=CLIENT", count: count((a) => a.type === "CLIENT"), active: type === "CLIENT" && !tier && !exec && !health, Icon: BuildingIcon },
        { label: "Agencies", href: "/accounts?type=AGENCY", count: count((a) => a.type === "AGENCY"), active: type === "AGENCY" && !tier && !exec && !health, Icon: BriefcaseIcon },
      ],
    },
    {
      heading: "Needs attention",
      items: [
        { label: "Going cold", href: "/accounts?health=COLD", count: count((a) => a.health.status === "COLD"), active: health === "COLD" && !type && !tier && !exec, Icon: SnowIcon },
        { label: "Cooling", href: "/accounts?health=COOLING", count: count((a) => a.health.status === "COOLING"), active: health === "COOLING" && !type && !tier && !exec, Icon: ClockIcon },
        { label: "No activity yet", href: "/accounts?health=NONE", count: count((a) => a.health.status === "NONE"), active: health === "NONE" && !type && !tier && !exec, Icon: ClockIcon },
      ],
    },
    {
      heading: "By tier",
      items: TIERS.map((t) => ({
        label: t.label,
        href: `/accounts?tier=${t.value}`,
        count: count((a) => a.tier === t.value),
        active: tier === t.value && !type && !exec && !health,
        dot: t.color,
      })),
    },
    {
      heading: "By sales exec",
      items: execs.map((u) => ({
        label: u.name,
        href: `/accounts?exec=${u.id}`,
        count: u.n,
        active: exec === u.id && !type && !tier && !health,
        Icon: UserIcon,
      })),
    },
  ];
  const activeItem = sections.flatMap((s) => s.items).find((i) => i.active);
  const viewLabel = activeItem?.label ?? (q ? `Search: "${q}"` : "Filtered accounts");

  const execOptions = users.filter((u) => u.role === "SALES" || u.role === "ADMIN").map((u) => ({ value: u.id, label: u.name }));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <ListPanel title="Account list" sections={sections} />

      <div className="min-w-0 flex-1 space-y-4">
        {/* Breadcrumb bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
          <p className="flex items-center gap-1.5 text-[13px]">
            <Link href="/accounts" className="text-gray-500 hover:text-black">
              Accounts
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold">{viewLabel}</span>
          </p>
          <div className="flex gap-2 text-xs">
            {isAdmin && (
              <Link href="/admin/import" className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-gray-700 hover:border-black">
                <UploadIcon className="h-3.5 w-3.5" />
                Import sales report
              </Link>
            )}
            <a href="/api/accounts/export" className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-gray-700 hover:border-black">
              <DownloadIcon className="h-3.5 w-3.5" />
              Download CSV
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
          <Link href="/accounts/new" className="flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-2 text-white hover:bg-gray-800">
            <PlusIcon className="h-3.5 w-3.5" />
            Add account
          </Link>
          <Link href="/contacts/new" className="flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-2 text-white hover:bg-gray-800">
            <PlusIcon className="h-3.5 w-3.5" />
            Add contact
          </Link>
        </div>

        {/* Title + search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold">
            {viewLabel} <span className="font-normal text-gray-400">({rows.length})</span>
          </h1>
          <form method="get" className="flex items-center gap-2">
            {type && <input type="hidden" name="type" value={type} />}
            {tier && <input type="hidden" name="tier" value={tier} />}
            {exec && <input type="hidden" name="exec" value={exec} />}
            {health && <input type="hidden" name="health" value={health} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Find in this list..."
              className="w-52 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-black"
            />
            {q && (
              <Link
                href={`/accounts?${new URLSearchParams({ ...(type && { type }), ...(tier && { tier }), ...(exec && { exec }), ...(health && { health }) }).toString()}`}
                className="text-sm text-gray-500 hover:underline"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {isAdmin && (
            <div className="border-b border-gray-100 px-4 py-1.5">
              <BulkDeleteBar />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {isAdmin && <th className="w-10 py-2 pl-5" />}
                  <th className={`py-2 pr-3 ${isAdmin ? "" : "pl-5"}`}>Account</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Tier</th>
                  <th className="py-2 pr-3">Sales exec</th>
                  <th className="py-2 pr-5">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const canEdit = canEditAccount(user, a);
                  const sub =
                    a.type === "AGENCY"
                      ? `${a._count.clients} ${a._count.clients === 1 ? "client" : "clients"}`
                      : [a.category?.mainCategory, a.parentAgency ? `via ${a.parentAgency.name}` : null].filter(Boolean).join(" · ") ||
                        `${a._count.contacts} ${a._count.contacts === 1 ? "contact" : "contacts"}`;
                  return (
                    <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      {isAdmin && (
                        <td className="py-2 pl-5">
                          <input type="checkbox" data-bulk value={a.id} aria-label={`Select ${a.name}`} className="h-4 w-4 accent-black" />
                        </td>
                      )}
                      <td className={`py-2 pr-3 ${isAdmin ? "" : "pl-5"}`}>
                        <Link href={`/accounts/${a.id}`} className="group flex items-center gap-2.5">
                          <Avatar name={a.name} square />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-black group-hover:underline">{a.name}</span>
                            <span className="block truncate text-[11px] text-gray-500">{sub}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className="inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ backgroundColor: TYPE_TONE[a.type].bg, color: TYPE_TONE[a.type].text }}
                        >
                          {a.type === "AGENCY" ? "Agency" : "Client"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <InlineSelect
                          endpoint={`/api/accounts/${a.id}`}
                          field="tier"
                          value={a.tier}
                          canEdit={canEdit}
                          tone={TIER_TONE}
                          options={TIERS.map((t) => ({ value: t.value, label: t.label }))}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        {isAdmin ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={a.salesExecutive.name} src={photoSrc(a.salesExecutive)} />
                            <InlineSelect
                              endpoint={`/api/accounts/${a.id}`}
                              field="salesExecutiveId"
                              value={a.salesExecutiveId}
                              canEdit
                              upper={false}
                              width="w-44"
                              options={execOptions}
                            />
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 whitespace-nowrap text-gray-700">
                            <Avatar name={a.salesExecutive.name} src={photoSrc(a.salesExecutive)} />
                            {a.salesExecutive.name}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-5">
                        <HealthPill health={a.health} />
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-10 text-center text-gray-400">
                      No accounts here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

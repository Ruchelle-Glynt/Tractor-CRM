import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Badge";
import ListPanel, { type PanelSection } from "@/components/ListPanel";
import InlineSelect from "@/components/InlineSelect";
import { ListIcon, UserIcon, StarIcon, CakeIcon, ClockIcon, PlusIcon, DownloadIcon, ChevronRightIcon, BriefcaseIcon, BuildingIcon } from "@/components/Icons";
import { getCurrentUser, canEditAccount } from "@/lib/permissions";
import { photoSrc } from "@/lib/photo";
import { saToday, nextBirthday, shortDate } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

const ROLES = [
  { value: "", label: "Not set" },
  { value: "DECISION_MAKER", label: "Decision maker" },
  { value: "INFLUENCER", label: "Influencer" },
  { value: "ADMINISTRATIVE", label: "Administrative" },
];
const ROLE_TONE = {
  DECISION_MAKER: { bg: "#FFE4EC", text: "#BE0044" },
  INFLUENCER: { bg: "#EEEAFE", text: "#4C22F2" },
  ADMINISTRATIVE: { bg: "#E6FAF4", text: "#037A5A" },
};

type Params = { q?: string; view?: string; role?: string; type?: string };

// Contacts list in the same layout as Accounts: views on the left, the table
// on the right with each person's decision role editable in place.
export default async function ContactsListPage({ searchParams }: { searchParams: Params }) {
  const user = await getCurrentUser();
  const q = searchParams.q?.trim() ?? "";
  const view = ["mine", "birthdays", "recent", "nobirthday"].includes(searchParams.view ?? "") ? searchParams.view! : "";
  const role = ROLES.some((r) => r.value && r.value === searchParams.role) ? searchParams.role! : "";
  const type = ["CLIENT", "AGENCY"].includes(searchParams.type ?? "") ? searchParams.type! : "";

  const contacts = await prisma.contact.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      email: true,
      decisionRole: true,
      birthday: true,
      createdAt: true,
      account: { select: { id: true, name: true, type: true, salesExecutiveId: true, salesExecutive: { select: { id: true, name: true, photoUpdatedAt: true } } } },
    },
    orderBy: { firstName: "asc" },
  });

  const today = saToday();
  const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const withBday = contacts.map((c) => ({ ...c, next: c.birthday ? nextBirthday(c.birthday, today) : null }));
  const inView = (c: (typeof withBday)[number]) =>
    view === "mine"
      ? c.account.salesExecutiveId === user?.id
      : view === "birthdays"
      ? c.next !== null && c.next.daysAway <= 30
      : view === "recent"
      ? c.createdAt >= recentCutoff
      : view === "nobirthday"
      ? !c.birthday
      : true;

  let rows = withBday.filter(
    (c) =>
      inView(c) &&
      (!role || c.decisionRole === role) &&
      (!type || c.account.type === type) &&
      (!q || `${c.firstName} ${c.lastName} ${c.title ?? ""} ${c.account.name} ${c.email ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );
  if (view === "birthdays") rows = rows.sort((a, b) => (a.next?.daysAway ?? 999) - (b.next?.daysAway ?? 999));
  if (view === "recent") rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // ---- Left panel ----
  const n = (f: (c: (typeof withBday)[number]) => boolean) => withBday.filter(f).length;
  const plain = !view && !role && !type;
  const mine = user ? n((c) => c.account.salesExecutiveId === user.id) : 0;
  const sections: PanelSection[] = [
    {
      items: [
        { label: "All contacts", href: "/contacts", count: contacts.length, active: plain, Icon: ListIcon },
        ...(mine > 0 ? [{ label: "On my accounts", href: "/contacts?view=mine", count: mine, active: view === "mine" && !role && !type, Icon: UserIcon }] : []),
        { label: "Birthdays soon", href: "/contacts?view=birthdays", count: n((c) => c.next !== null && c.next.daysAway <= 30), active: view === "birthdays" && !role && !type, Icon: CakeIcon },
        { label: "Recently added", href: "/contacts?view=recent", count: n((c) => c.createdAt >= recentCutoff), active: view === "recent" && !role && !type, Icon: ClockIcon },
        { label: "Missing a birthday", href: "/contacts?view=nobirthday", count: n((c) => !c.birthday), active: view === "nobirthday" && !role && !type, Icon: CakeIcon },
      ],
    },
    {
      heading: "By decision role",
      items: ROLES.filter((r) => r.value).map((r) => ({
        label: r.label,
        href: `/contacts?role=${r.value}`,
        count: n((c) => c.decisionRole === r.value),
        active: role === r.value && !view && !type,
        dot: ROLE_TONE[r.value as keyof typeof ROLE_TONE].text,
      })),
    },
    {
      heading: "By company type",
      items: [
        { label: "At clients", href: "/contacts?type=CLIENT", count: n((c) => c.account.type === "CLIENT"), active: type === "CLIENT" && !view && !role, Icon: BuildingIcon },
        { label: "At agencies", href: "/contacts?type=AGENCY", count: n((c) => c.account.type === "AGENCY"), active: type === "AGENCY" && !view && !role, Icon: BriefcaseIcon },
      ],
    },
  ];
  const active = sections.flatMap((s) => s.items).find((i) => i.active);
  const viewLabel = active?.label ?? (q ? `Search: "${q}"` : "Filtered contacts");

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <ListPanel title="Contact list" sections={sections} />

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
          <p className="flex items-center gap-1.5 text-[13px]">
            <Link href="/contacts" className="text-gray-500 hover:text-black">
              Contacts
            </Link>
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-semibold">{viewLabel}</span>
          </p>
          <a href="/api/contacts/export" className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:border-black">
            <DownloadIcon className="h-3.5 w-3.5" />
            Download CSV
          </a>
        </div>

        <div className="flex flex-wrap gap-2 text-[13px] font-semibold">
          <Link href="/contacts/new" className="flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-2 text-white hover:bg-gray-800">
            <PlusIcon className="h-3.5 w-3.5" />
            Add contact
          </Link>
          <Link href="/accounts/new" className="flex items-center gap-1.5 rounded-md bg-navy px-3.5 py-2 text-white hover:bg-gray-800">
            <PlusIcon className="h-3.5 w-3.5" />
            Add account
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold">
            {viewLabel} <span className="font-normal text-gray-400">({rows.length})</span>
          </h1>
          <form method="get" className="flex items-center gap-2">
            {view && <input type="hidden" name="view" value={view} />}
            {role && <input type="hidden" name="role" value={role} />}
            {type && <input type="hidden" name="type" value={type} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Find in this list..."
              className="w-52 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-black"
            />
          </form>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-2 pl-5 pr-3">Name</th>
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">Decision role</th>
                  <th className="py-2 pr-3">Birthday</th>
                  <th className="py-2 pr-5">Sales exec</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const name = `${c.firstName} ${c.lastName}`;
                  return (
                    <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="py-2 pl-5 pr-3">
                        <Link href={`/contacts/${c.id}`} className="group flex items-center gap-2.5">
                          <Avatar name={name} square />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold group-hover:underline">
                              {name}
                              {c.decisionRole === "DECISION_MAKER" && <StarIcon className="ml-1 inline h-3 w-3 text-[#F7B500]" />}
                            </span>
                            <span className="block truncate text-[11px] text-gray-500">{c.title ?? c.email ?? "-"}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <Link href={`/accounts/${c.account.id}`} className="text-gray-800 hover:underline">
                          {c.account.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">
                        <InlineSelect
                          endpoint={`/api/contacts/${c.id}`}
                          field="decisionRole"
                          value={c.decisionRole ?? ""}
                          canEdit={canEditAccount(user, c.account)}
                          tone={ROLE_TONE}
                          options={ROLES}
                        />
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-gray-700">
                        {c.birthday && c.next ? (
                          <>
                            {shortDate(c.birthday)}
                            {c.next.daysAway <= 30 && (
                              <span className="ml-2 rounded-full bg-yellow px-1.5 py-0.5 text-[10px] font-semibold text-black">
                                {c.next.daysAway === 0 ? "Today" : `in ${c.next.daysAway}d`}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 pr-5">
                        <span className="flex items-center gap-2 whitespace-nowrap text-gray-700">
                          <Avatar name={c.account.salesExecutive.name} src={photoSrc(c.account.salesExecutive)} />
                          {c.account.salesExecutive.name}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      No contacts here.
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

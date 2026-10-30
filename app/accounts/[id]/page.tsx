import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TypeBadge, TierBadge } from "@/components/Badge";
import AccountActivities from "@/components/AccountActivities";
import HealthPill from "@/components/HealthPill";
import AccountSpend from "@/components/AccountSpend";
import { healthFor } from "@/lib/health";
import { getCurrentUser, canEditAccount } from "@/lib/permissions";

// See app/accounts/page.tsx for why this is needed - without it Next.js may
// statically cache this page and hide edits until the next deploy.
export const dynamic = "force-dynamic";

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      subcategory: true,
      salesExecutive: true,
      mainContact: true,
      parentAgency: true,
      clients: { include: { category: true } },
      contacts: { orderBy: { firstName: "asc" } },
      contracts: { orderBy: { endDate: "asc" } },
      activities: {
        include: {
          owner: { select: { name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { activityDate: "desc" },
      },
      growthMetrics: { orderBy: { period: "desc" }, take: 36 },
    },
  });

  if (!account) notFound();

  const currentUser = await getCurrentUser();
  const canEdit = canEditAccount(currentUser, account);

  // Prisma returns money as Decimal objects, which can't be handed to a
  // client component - convert to plain numbers and date strings first.
  const activities = account.activities.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    activityDate: a.activityDate.toISOString(),
    value: a.value === null ? null : Number(a.value),
    ownerId: a.ownerId,
    owner: a.owner,
    contact: a.contact,
  }));

  // Agencies don't carry a single category themselves - they can span many
  // industries depending on which clients they manage. Roll those up here
  // instead of showing a placeholder like "N/A".
  const clientIndustries = Array.from(
    new Set(account.clients.map((c) => c.category?.mainCategory).filter((v): v is string => Boolean(v)))
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-navy">{account.name}</h1>
            <TypeBadge type={account.type} />
            <TierBadge tier={account.tier} />
            <HealthPill health={healthFor(account.activities[0]?.activityDate)} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {account.type === "CLIENT" && account.category
              ? `${account.category.mainCategory}${
                  account.subcategory ? ` / ${account.subcategory.subcategory}` : ""
                }`
              : ""}
          </p>
          {account.type === "AGENCY" && clientIndustries.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">Industries across managed clients: {clientIndustries.join(", ")}</p>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/accounts/${account.id}/edit`} className="rounded border border-navy px-4 py-2 text-sm text-navy">
              Edit account
            </Link>
            <Link href={`/contacts/new?accountId=${account.id}`} className="rounded bg-navy px-4 py-2 text-sm text-white">
              + Add contact
            </Link>
          </div>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Sales executive</dt>
          <dd className="font-medium">{account.salesExecutive.name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Fiscal year</dt>
          <dd className="font-medium">{account.fiscalYearStart.replaceAll("_", "-")}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Main contact</dt>
          <dd className="font-medium">
            {account.mainContact
              ? `${account.mainContact.firstName} ${account.mainContact.lastName}${
                  account.mainContact.title ? ` (${account.mainContact.title})` : ""
                }`
              : "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Media agency</dt>
          <dd className="font-medium">
            {account.parentAgency ? (
              <Link href={`/accounts/${account.parentAgency.id}`} className="text-navy hover:underline">
                {account.parentAgency.name}
              </Link>
            ) : (
              "-"
            )}
          </dd>
        </div>
      </dl>

      {/* Full team roster (Priority 1) - every contact, linking to their own detail page */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Team</h2>
        {account.contacts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No contacts yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
            {account.contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between px-4 py-3">
                <Link href={`/contacts/${contact.id}`} className="text-navy hover:underline">
                  {contact.firstName} {contact.lastName}
                </Link>
                <span className="text-sm text-gray-500">{contact.title ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activity log (Priority 6) - gifts, events, calls, meetings */}
      <AccountActivities
        accountId={account.id}
        contacts={account.contacts.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }))}
        initialActivities={activities}
        currentUserId={currentUser?.id ?? ""}
        isAdmin={currentUser?.role === "ADMIN"}
      />

      {/* Media agency's linked direct clients, if this account is an agency */}
      {account.clients.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Linked clients</h2>
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
            {account.clients.map((client) => (
              <li key={client.id} className="flex items-center justify-between px-4 py-3">
                <Link href={`/accounts/${client.id}`} className="text-navy hover:underline">
                  {client.name}
                </Link>
                <span className="text-sm text-gray-500">{client.category?.mainCategory ?? ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contracts (spec 4.4a) - manual entry, trade and non-trade alike */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Contracts</h2>
        {account.contracts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No contracts recorded yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="py-2">Deal type</th>
                <th className="py-2">Ends</th>
                <th className="py-2">Status</th>
                <th className="py-2">ROFR</th>
              </tr>
            </thead>
            <tbody>
              {account.contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-gray-100">
                  <td className="py-2">{contract.dealType.replaceAll("_", " ")}</td>
                  <td className="py-2">{new Date(contract.endDate).toLocaleDateString()}</td>
                  <td className="py-2">{contract.status}</td>
                  <td className="py-2">
                    {contract.hasFirstRightOfRefusal ? contract.rofrStatus ?? "PENDING" : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Growth tracking (Priority 7) - monthly spend and holding size */}
      <AccountSpend
        accountId={account.id}
        canEdit={canEdit}
        initialItems={account.growthMetrics.map((m) => ({
          id: m.id,
          period: m.period.toISOString(),
          spendAmount: Number(m.spendAmount),
          holdingSize: m.holdingSize === null ? null : Number(m.holdingSize),
        }))}
      />
    </div>
  );
}

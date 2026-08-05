import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      subcategory: true,
      salesExecutive: true,
      mainContact: true,
      parentAgency: true,
      clients: true,
      contacts: { orderBy: { firstName: "asc" } },
      contracts: { orderBy: { endDate: "asc" } },
      growthMetrics: { orderBy: { period: "desc" }, take: 12 },
    },
  });

  if (!account) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{account.name}</h1>
          <p className="text-sm text-gray-500">
            {account.type} · {account.tier.replace("_", " ")} ·{" "}
            {account.category?.mainCategory}
            {account.subcategory ? ` / ${account.subcategory.subcategory}` : ""}
          </p>
        </div>
        <Link href="/contacts/new" className="rounded bg-navy px-4 py-2 text-sm text-white">
          + Add contact
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Sales executive</dt>
          <dd className="font-medium">{account.salesExecutive.name}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Fiscal year</dt>
          <dd className="font-medium">{account.fiscalYearStart.replace("_", "-")}</dd>
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
          <dt className="text-gray-500">Parent agency</dt>
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

      {/* Agency's linked direct clients, if this account is an agency */}
      {account.clients.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Linked clients</h2>
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
            {account.clients.map((client) => (
              <li key={client.id} className="px-4 py-3">
                <Link href={`/accounts/${client.id}`} className="text-navy hover:underline">
                  {client.name}
                </Link>
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

      {/* Growth tracking (Priority 7) - most recent months */}
      <section className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-navy">Recent spend</h2>
        {account.growthMetrics.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No growth data yet.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-gray-500">
                <th className="py-2">Period</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Spend</th>
              </tr>
            </thead>
            <tbody>
              {account.growthMetrics.map((metric) => (
                <tr key={metric.id} className="border-b border-gray-100">
                  <td className="py-2">{new Date(metric.period).toLocaleDateString()}</td>
                  <td className="py-2">{metric.channelType ?? "Unspecified"}</td>
                  <td className="py-2">R{Number(metric.spendAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

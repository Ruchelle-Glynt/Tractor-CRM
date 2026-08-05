import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: { account: true, activities: { orderBy: { activityDate: "desc" } } },
  });

  if (!contact) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">
        {contact.firstName} {contact.lastName}
      </h1>
      <p className="text-sm text-gray-500">
        {contact.title ?? "No title set"} ·{" "}
        <Link href={`/accounts/${contact.account.id}`} className="text-navy hover:underline">
          {contact.account.name}
        </Link>
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{contact.email ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Phone</dt>
          <dd className="font-medium">{contact.phone ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Birthday</dt>
          <dd className="font-medium">
            {contact.birthday ? new Date(contact.birthday).toLocaleDateString() : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Decision role</dt>
          <dd className="font-medium">{contact.decisionRole?.replaceAll("_", " ") ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Interests</dt>
          <dd className="font-medium">{contact.interests.join(", ") || "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Family & pet notes</dt>
          <dd className="font-medium">{contact.familyPetNotes ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Who they are as people</dt>
          <dd className="font-medium">{contact.personalityNotes ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Gift preferences</dt>
          <dd className="font-medium">{contact.giftPreferences ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Gift restrictions</dt>
          <dd className="font-medium">{contact.giftRestrictions ?? "-"}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">Activity</h2>
        {contact.activities.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No activity logged yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
            {contact.activities.map((activity) => (
              <li key={activity.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{activity.type.replaceAll("_", " ")}</span> —{" "}
                {activity.description ?? "no description"} (
                {new Date(activity.activityDate).toLocaleDateString()})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

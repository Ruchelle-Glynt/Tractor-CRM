import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search?q=... - quick search across accounts, contacts and leads,
// used by the Ctrl+K search box in the nav bar.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const words = q.split(/\s+/).filter(Boolean).slice(0, 4);
  const has = (field: string) => ({ [field]: { contains: q, mode: "insensitive" as const } });

  const [accounts, contacts, leads] = await Promise.all([
    prisma.account.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
      take: 6,
    }),
    prisma.contact.findMany({
      where: {
        OR: [
          // every word matches either first or last name ("thandi mok")
          {
            AND: words.map((w) => ({
              OR: [
                { firstName: { contains: w, mode: "insensitive" as const } },
                { lastName: { contains: w, mode: "insensitive" as const } },
              ],
            })),
          },
          has("email"),
          has("title"),
        ],
      },
      select: { id: true, firstName: true, lastName: true, title: true, account: { select: { name: true } } },
      orderBy: { firstName: "asc" },
      take: 6,
    }),
    prisma.lead.findMany({
      where: { OR: [has("contactName"), has("companyName"), has("contactEmail")] },
      select: { id: true, contactName: true, companyName: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const results = [
    ...accounts.map((a) => ({
      kind: a.type === "AGENCY" ? "Agency" : "Account",
      id: a.id,
      title: a.name,
      subtitle: a.type === "AGENCY" ? "Media agency" : "Client",
      href: `/accounts/${a.id}`,
    })),
    ...contacts.map((c) => ({
      kind: "Contact",
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: [c.title, c.account.name].filter(Boolean).join(" · "),
      href: `/contacts/${c.id}`,
    })),
    ...leads.map((l) => ({
      kind: "Lead",
      id: l.id,
      title: l.contactName,
      subtitle: [l.companyName, l.status.charAt(0) + l.status.slice(1).toLowerCase()].filter(Boolean).join(" · "),
      href: `/leads/${l.id}`,
    })),
  ];

  return NextResponse.json({ results });
}

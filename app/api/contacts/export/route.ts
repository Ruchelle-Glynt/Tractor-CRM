import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/contacts/export - downloads the full Contacts list as a CSV file.
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const contacts = await prisma.contact.findMany({
    include: { account: true },
    orderBy: { firstName: "asc" },
  });

  const headers = [
    "First Name",
    "Last Name",
    "Title",
    "Account",
    "Email",
    "Phone",
    "Birthday",
    "Decision Role",
    "Interests",
    "Family & Pet Notes",
    "Gift Preferences",
    "Gift Restrictions",
  ];

  const rows = contacts.map((c) => [
    c.firstName,
    c.lastName,
    c.title ?? "",
    c.account.name,
    c.email ?? "",
    c.phone ?? "",
    c.birthday ? c.birthday.toISOString().slice(0, 10) : "",
    c.decisionRole?.replaceAll("_", " ") ?? "",
    c.interests.join("; "),
    c.familyPetNotes ?? "",
    c.giftPreferences ?? "",
    c.giftRestrictions ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  const body = "﻿" + csv;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts.csv"`,
    },
  });
}

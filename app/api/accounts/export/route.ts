import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/accounts/export - downloads the full Accounts list as a CSV file,
// matching what you'd see on the Accounts page plus a few extra columns
// that don't fit in the on-screen table.
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

  const accounts = await prisma.account.findMany({
    include: { category: true, subcategory: true, salesExecutive: true, mainContact: true, parentAgency: true },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Name",
    "Type",
    "Tier",
    "Category",
    "Subcategory",
    "Fiscal Year",
    "Sales Executive",
    "Media Agency",
    "Main Contact",
    "Created",
  ];

  const rows = accounts.map((a) => [
    a.name,
    a.type,
    a.tier.replaceAll("_", " "),
    a.category?.mainCategory ?? "",
    a.subcategory?.subcategory ?? "",
    a.fiscalYearStart.replaceAll("_", "-"),
    a.salesExecutive.name,
    a.parentAgency?.name ?? "",
    a.mainContact ? `${a.mainContact.firstName} ${a.mainContact.lastName}` : "",
    a.createdAt.toISOString().slice(0, 10),
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  // Leading BOM so Excel opens the UTF-8 file correctly instead of mangling accents.
  const body = "﻿" + csv;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="accounts.csv"`,
    },
  });
}

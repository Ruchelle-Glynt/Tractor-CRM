import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    include: {
      linkedAccount: { select: { id: true, name: true } },
      transferredToUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Leads</h1>
        <Link
          href="/leads/new"
          style={{ padding: "8px 16px", backgroundColor: "#052132", color: "white", borderRadius: 4, textDecoration: "none" }}
        >
          + New Lead
        </Link>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: 8 }}>Contact</th>
            <th style={{ padding: 8 }}>Company</th>
            <th style={{ padding: 8 }}>Source</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Transferred To</th>
            <th style={{ padding: 8 }}>Linked Account</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/leads/${l.id}`}>{l.contactName}</Link>
              </td>
              <td style={{ padding: 8 }}>{l.companyName ?? "—"}</td>
              <td style={{ padding: 8 }}>{l.source}</td>
              <td style={{ padding: 8 }}>{l.status}</td>
              <td style={{ padding: 8 }}>{l.transferredToUser.name}</td>
              <td style={{ padding: 8 }}>{l.linkedAccount?.name ?? "—"}</td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#666" }}>
                No leads yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import LeadActions from "@/components/LeadActions";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #eee" }}>
      <div style={{ width: 220, color: "#666" }}>{label}</div>
      <div>{value ?? "—"}</div>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, accounts] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        linkedAccount: { select: { id: true, name: true } },
        transferredToUser: { select: { id: true, name: true } },
      },
    }),
    prisma.account.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!lead) return notFound();

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
      <Link href="/leads" style={{ fontSize: 14 }}>
        &larr; Leads
      </Link>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "12px 0 24px" }}>{lead.contactName}</h1>

      <Row label="Source" value={lead.source} />
      <Row label="Status" value={lead.status} />
      <Row label="Company" value={lead.companyName} />
      <Row label="Email" value={lead.contactEmail} />
      <Row label="Phone" value={lead.contactPhone} />
      <Row label="Transferred to" value={lead.transferredToUser.name} />
      <Row
        label="Linked account"
        value={lead.linkedAccount ? <Link href={`/accounts/${lead.linkedAccount.id}`}>{lead.linkedAccount.name}</Link> : null}
      />
      <Row label="Converted value" value={lead.convertedValue?.toString()} />
      <Row label="Converted at" value={lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : null} />
      <Row label="Created" value={new Date(lead.createdAt).toLocaleDateString()} />

      <div style={{ marginTop: 24 }}>
        <LeadActions
          leadId={lead.id}
          status={lead.status}
          linkedAccountId={lead.linkedAccountId}
          accounts={accounts}
        />
      </div>
    </div>
  );
}

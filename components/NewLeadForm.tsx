"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = { id: string; name: string };
type AccountOption = { id: string; name: string };

export default function NewLeadForm({
  users,
  accounts,
}: {
  users: UserOption[];
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const [source, setSource] = useState("WEBSITE");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState("");
  const [transferredToUserId, setTransferredToUserId] = useState(users[0]?.id ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!contactName || !transferredToUserId) {
      setError("Contact name and transferred-to user are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          contactName,
          contactEmail,
          contactPhone,
          companyName,
          linkedAccountId,
          transferredToUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push(`/leads/${data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Source *
        <select value={source} onChange={(e) => setSource(e.target.value)} required style={{ padding: 8 }}>
          <option value="WEBSITE">Website</option>
          <option value="SOCIAL">Social</option>
          <option value="TELEPHONIC">Telephonic</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Contact name *
        <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} required style={{ padding: 8 }} />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          Contact email
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={{ padding: 8 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          Contact phone
          <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={{ padding: 8 }} />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Company name
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ padding: 8 }} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Link to an existing account <span style={{ fontWeight: 400, color: "#666" }}>(optional — can be set later)</span>
        <select value={linkedAccountId} onChange={(e) => setLinkedAccountId(e.target.value)} style={{ padding: 8 }}>
          <option value="">Not linked yet</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Transferred to *
        <select
          value={transferredToUserId}
          onChange={(e) => setTransferredToUserId(e.target.value)}
          required
          style={{ padding: 8 }}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>

      {error && <div style={{ color: "#c0392b", fontSize: 14 }}>{error}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "10px 16px", backgroundColor: "#052132", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        {loading ? "Saving..." : "Save lead"}
      </button>
    </form>
  );
}

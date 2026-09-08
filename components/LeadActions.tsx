"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AccountOption = { id: string; name: string };

export default function LeadActions({
  leadId,
  status,
  linkedAccountId,
  accounts,
}: {
  leadId: string;
  status: string;
  linkedAccountId: string | null;
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(linkedAccountId ?? "");
  const [convertedValue, setConvertedValue] = useState("");

  async function patch(data: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} style={{ padding: 8 }}>
          <option value="">Not linked</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          disabled={loading}
          onClick={() => patch({ linkedAccountId: selectedAccount })}
          style={{ padding: "8px 14px", border: "1px solid #052132", background: "white", color: "#052132", borderRadius: 4, cursor: "pointer" }}
        >
          Link account
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {status !== "CONTACTED" && status !== "CONVERTED" && status !== "LOST" && (
          <button
            disabled={loading}
            onClick={() => patch({ status: "CONTACTED" })}
            style={{ padding: "8px 14px", border: "1px solid #052132", background: "white", color: "#052132", borderRadius: 4, cursor: "pointer" }}
          >
            Mark contacted
          </button>
        )}
        {status !== "CONVERTED" && status !== "LOST" && (
          <button
            disabled={loading}
            onClick={() => patch({ status: "LOST" })}
            style={{ padding: "8px 14px", border: "1px solid #c0392b", background: "white", color: "#c0392b", borderRadius: 4, cursor: "pointer" }}
          >
            Mark lost
          </button>
        )}
      </div>

      {status !== "CONVERTED" && status !== "LOST" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            step="0.01"
            placeholder="Converted value"
            value={convertedValue}
            onChange={(e) => setConvertedValue(e.target.value)}
            style={{ padding: 8, width: 160 }}
          />
          <button
            disabled={loading || !convertedValue}
            onClick={() => patch({ status: "CONVERTED", convertedValue, convertedAt: new Date().toISOString() })}
            style={{ padding: "8px 14px", backgroundColor: "#052132", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            Mark converted
          </button>
        </div>
      )}
    </div>
  );
}

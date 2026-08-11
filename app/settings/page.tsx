"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Something went wrong" });
      } else {
        setMessage({ type: "success", text: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Account Settings</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Confirm new password
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4 }} />
        </label>
        {message && (
          <div style={{ padding: 8, borderRadius: 4, backgroundColor: message.type === "success" ? "#e6f4ea" : "#fdecea", color: message.type === "success" ? "#1e7e34" : "#c0392b", fontSize: 14 }}>
            {message.text}
          </div>
        )}
        <button type="submit" disabled={loading} style={{ padding: "10px 16px", backgroundColor: "#052132", color: "white", border: "none", borderRadius: 4, cursor: "pointer", marginTop: 8 }}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
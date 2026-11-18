"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = {
  configured: boolean;
  connection: { msEmail: string; lastSyncAt: string | null; lastError: string | null; lastLogged: number } | null;
  notice: { kind: "ok" | "error"; text: string } | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
function when(iso: string) {
  const d = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000); // SA time
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// Profile > Outlook: connect your Microsoft 365 mailbox so meetings and emails
// with CRM contacts are logged as Activity automatically.
export default function OutlookCard({ status }: { status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const [msg, setMsg] = useState(status.notice);
  const c = status.connection;

  async function sync() {
    setBusy("sync");
    setMsg(null);
    const res = await fetch("/api/outlook/sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) setMsg({ kind: "error", text: data.error ?? "Sync failed." });
    else
      setMsg({
        kind: "ok",
        text: data.logged ? `Added ${data.meetings} meetings and ${data.emails} emails to Activity.` : "Up to date - nothing new with CRM contacts.",
      });
    router.refresh();
  }

  async function disconnect() {
    if (!window.confirm("Stop syncing your Outlook? Activity already logged stays in the CRM.")) return;
    setBusy("disconnect");
    await fetch("/api/outlook/disconnect", { method: "POST" });
    setBusy(null);
    setMsg({ kind: "ok", text: "Outlook disconnected." });
    router.refresh();
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0078D4] text-lg font-bold text-white">O</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">Outlook</h2>
          <p className="text-sm text-gray-500">
            Logs your meetings and emails with people in Contacts as Activity on their account - the subject and a short preview only.
            Syncs every night, or when you press Sync now.
          </p>

          {!status.configured ? (
            <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Waiting for IT to finish the Microsoft 365 set-up. Once they have, a Connect button appears here.
            </p>
          ) : !c ? (
            <a href="/api/outlook/connect" className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#0078D4] px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
              Connect Outlook
            </a>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <p>
                Connected as <span className="font-semibold">{c.msEmail}</span>
                <span className="text-gray-500">
                  {" "}
                  · {c.lastSyncAt ? `last synced ${when(c.lastSyncAt)}` : "not synced yet"}
                  {c.lastSyncAt && c.lastLogged > 0 && ` (${c.lastLogged} added)`}
                </span>
              </p>
              {c.lastError && (
                <p className="rounded-lg bg-[#FFF5F8] px-3 py-2 text-[#BE0044]">
                  Last sync didn&apos;t work: {c.lastError}. Try Sync now; if it keeps failing, disconnect and connect again.
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={sync} disabled={busy !== null} className="rounded-md bg-navy px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50">
                  {busy === "sync" ? "Syncing..." : "Sync now"}
                </button>
                <button onClick={disconnect} disabled={busy !== null} className="rounded-md border border-gray-300 px-3.5 py-1.5 text-[13px] hover:border-black disabled:opacity-50">
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {msg && <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-[#037A5A]" : "text-red-600"}`}>{msg.text}</p>}
        </div>
      </div>
    </section>
  );
}

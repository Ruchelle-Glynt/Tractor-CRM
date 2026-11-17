"use client";
import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
// SA time (UTC+2, no daylight saving), formatted by hand so the server and
// the browser always show exactly the same text.
function formatWhen(iso: string) {
  const d = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hh}:${mm}`;
}

export type CommentItem = { id: string; body: string; createdAt: string; authorId: string; author: { name: string } };

// Timestamped notes on an account - holding expirations, iconic site bookings
// ending, anything worth flagging to the team. Newest first.
export default function AccountComments({
  accountId,
  initialComments,
  currentUserId,
  isAdmin,
}: {
  accountId: string;
  initialComments: CommentItem[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/accounts/${accountId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setComments([data, ...comments]);
    setText("");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments(comments.filter((c) => c.id !== id));
    else setError((await res.json().catch(() => ({}))).error ?? "Couldn't delete.");
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-navy">Comments</h2>
      <p className="text-sm text-gray-500">Notes for the team: holdings expiring, iconic site bookings ending, anything worth flagging.</p>

      <form onSubmit={add} className="mt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(e);
          }}
          rows={2}
          placeholder="e.g. Main Rd iconic site booking ends 15 Nov - client to confirm renewal by 1 Nov"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="rounded bg-navy px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {saving ? "Adding..." : "Add comment"}
          </button>
          <span className="text-xs text-gray-400">Ctrl + Enter to post</span>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">No comments yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100 rounded border border-gray-200 bg-white">
          {comments.map((c) => (
            <li key={c.id} className="px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="whitespace-pre-wrap text-gray-800">{c.body}</p>
                {(c.authorId === currentUserId || isAdmin) && (
                  <button onClick={() => remove(c.id)} className="shrink-0 text-xs text-gray-400 hover:text-red-600">
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {c.author.name} ·{" "}
                {formatWhen(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";
import { useState } from "react";

// A small dropdown inside a table row that saves straight away (e.g. an
// account's tier). Shows the value as plain text when the user can't edit it.
export default function InlineSelect({
  endpoint,
  field,
  value,
  options,
  canEdit,
  tone,
  upper = true,
  width = "w-36",
}: {
  endpoint: string;
  field: string;
  value: string;
  options: { value: string; label: string }[];
  canEdit: boolean;
  tone?: Record<string, { bg: string; text: string }>;
  upper?: boolean;
  width?: string;
}) {
  const caseCls = upper ? "uppercase tracking-wide text-[10px] font-semibold" : "text-xs";
  const [current, setCurrent] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const label = options.find((o) => o.value === current)?.label ?? current;
  const style = tone?.[current];

  if (!canEdit) {
    return (
      <span className={`inline-block rounded-md px-2 py-0.5 ${caseCls}`} style={style ? { backgroundColor: style.bg, color: style.text } : undefined}>
        {label}
      </span>
    );
  }

  async function save(next: string) {
    const prev = current;
    setCurrent(next);
    setState("saving");
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next || null }),
    });
    if (res.ok) setState("idle");
    else {
      setCurrent(prev);
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <select
        value={current}
        onChange={(e) => save(e.target.value)}
        disabled={state === "saving"}
        title={state === "error" ? "Couldn't save - try again" : "Change"}
        className={`${width} cursor-pointer appearance-none rounded-md border py-1 pl-2 pr-6 ${caseCls} outline-none focus:ring-2 focus:ring-yellow ${
          state === "error" ? "border-red-500" : "border-gray-300 hover:border-gray-500"
        } ${state === "saving" ? "opacity-60" : ""}`}
        style={style ? { backgroundColor: style.bg, color: style.text, borderColor: "transparent" } : { backgroundColor: "#fff" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-1.5 h-2.5 w-2.5" viewBox="0 0 12 12" fill="currentColor" style={{ color: style?.text ?? "#6B7280" }}>
        <path d="M2 4l4 4 4-4z" />
      </svg>
    </span>
  );
}

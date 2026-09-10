// Small colour-coded pieces used across list and detail pages, pulling from
// the Tractor Outdoor accent palette (see tailwind.config.ts) rather than
// plain grey text - inspired by the colored pills/avatars reference shared
// for the CRM refresh.
const PALETTE = ["#04CA95", "#FF005B", "#4C22F2", "#F7D849"];

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function TypeBadge({ type }: { type: string }) {
  const color = type === "AGENCY" ? "#4C22F2" : "#04CA95";
  return (
    <span
      style={{ backgroundColor: color }}
      className="inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white"
    >
      {type === "AGENCY" ? "Agency" : "Client"}
    </span>
  );
}

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  TIER_1: { bg: "#FF005B", text: "#fff", label: "Tier 1" },
  TIER_2: { bg: "#F7D849", text: "#000", label: "Tier 2" },
  TIER_3: { bg: "#04CA95", text: "#fff", label: "Tier 3" },
  TO_BE_ASSIGNED: { bg: "#D1D5DB", text: "#374151", label: "To Be Assigned" },
};

export function TierBadge({ tier }: { tier: string }) {
  const info = TIER_COLORS[tier] ?? TIER_COLORS.TO_BE_ASSIGNED;
  return (
    <span
      style={{ backgroundColor: info.bg, color: info.text }}
      className="inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
    >
      {info.label}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const color = hashColor(name);
  return (
    <span
      style={{ backgroundColor: color }}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
    >
      {initial}
    </span>
  );
}

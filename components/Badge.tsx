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
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
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
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
    >
      {info.label}
    </span>
  );
}

// A person's photo, or a coloured initial if there isn't one. "square"
// (bigger, rounded corners) is used for companies in list tables.
// "size" overrides the default size, e.g. "h-20 w-20 text-2xl" on the profile.
export function Avatar({
  name,
  square = false,
  src,
  size,
}: {
  name: string;
  square?: boolean;
  src?: string | null;
  size?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const color = hashColor(name);
  const dims = size ?? (square ? "h-8 w-8 text-[13px]" : "h-6 w-6 text-[11px]");
  const shape = square ? "rounded-md" : "rounded-full";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} title={name} className={`${dims} ${shape} shrink-0 object-cover`} />;
  }
  return (
    <span
      style={{ backgroundColor: color, color: color === "#F7D849" ? "#000" : "#fff" }}
      className={`inline-flex shrink-0 items-center justify-center font-semibold ${dims} ${shape}`}
      title={name}
    >
      {initial}
    </span>
  );
}

// Shared labels for the Activity log (spec 4.4, Priority 6).
export const ACTIVITY_TYPES = [
  { value: "MEETING", label: "Meeting" },
  { value: "CALL", label: "Call" },
  { value: "GIFT", label: "Gift" },
  { value: "EVENT", label: "Event" },
  { value: "CAMPAIGN_DRIVE", label: "Campaign drive" },
  { value: "OTHER", label: "Other" },
] as const;

export function activityLabel(type: string) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label ?? type;
}

// Formatted by hand (not toLocaleString) so the server and the browser
// always produce exactly the same text - e.g. "1 850" or "12 500.50".
export function formatNumber(value: number, decimals = 2): string {
  const raw = Math.abs(value).toFixed(decimals);
  const fixed = raw.includes(".") ? raw.replace(/\.?0+$/, "") : raw;
  const [whole, frac] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${value < 0 ? "-" : ""}${grouped}${frac ? `.${frac}` : ""}`;
}

export function formatRand(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return `R${formatNumber(value)}`;
}

// Short form for tight spaces: R950, R12k, R1.2m
export function formatRandShort(value: number): string {
  if (value >= 1_000_000_000) return `R${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, "")}bn`;
  if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  if (value >= 10_000) return `R${Math.round(value / 1_000)}k`;
  return `R${formatNumber(Math.round(value), 0)}`;
}

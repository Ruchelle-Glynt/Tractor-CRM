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

export function formatRand(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return `R${value.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;
}

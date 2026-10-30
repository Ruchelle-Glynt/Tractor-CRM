import { HEALTH_STYLE, healthLabel, type Health } from "@/lib/health";

export default function HealthPill({ health }: { health: Health }) {
  const style = HEALTH_STYLE[health.status];
  return (
    <span
      title={health.lastActivity ? `Last activity ${health.lastActivity.toLocaleDateString("en-ZA", { timeZone: "UTC" })}` : undefined}
      style={{ backgroundColor: style.bg, color: style.text }}
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
    >
      {healthLabel(health)}
    </span>
  );
}

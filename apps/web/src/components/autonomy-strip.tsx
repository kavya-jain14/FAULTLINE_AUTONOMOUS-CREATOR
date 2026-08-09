import type { AutonomyStatus } from "@faultline/contracts";

import { formatUtc, timeUntil } from "../lib/time";

interface AutonomyStripProps {
  status: AutonomyStatus | null;
  postsFallback: number;
  loading: boolean;
}

export function AutonomyStrip({
  status,
  postsFallback,
  loading,
}: AutonomyStripProps): React.JSX.Element {
  const metrics = [
    {
      label: "Started",
      value: status ? formatUtc(status.initializedAt) : "Awaiting telemetry",
      numeric: false,
    },
    {
      label: "Last scan",
      value: status ? formatUtc(status.lastRunAt) : "—",
      numeric: false,
    },
    {
      label: "Next scan",
      value: status ? timeUntil(status.nextRunAt) : "—",
      numeric: false,
    },
    {
      label: "Notes",
      value: String(status?.postsPublished ?? postsFallback),
      numeric: true,
    },
    {
      label: "Skipped",
      value: status ? String(status.candidatesRejected) : "—",
      numeric: true,
    },
  ] as const;

  return (
    <section className={`autonomy-strip ${loading ? "is-loading" : ""}`} aria-label="Autonomy status">
      <div className="strip-heading">
        <span className="live-pulse" />
        Mira is running independently
      </div>
      {metrics.map((metric) => (
        <div className="autonomy-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong className={metric.numeric ? "metric-number" : ""}>
            {metric.value}
          </strong>
        </div>
      ))}
    </section>
  );
}

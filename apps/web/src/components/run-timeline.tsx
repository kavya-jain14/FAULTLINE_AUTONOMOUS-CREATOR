import type { RunTimelineItem } from "@faultline/contracts";

import { formatCompactUtc } from "../lib/time";

const statusLabel = {
  completed: "Completed",
  running: "In progress",
  partial: "Completed with limits",
  failed: "Needs attention",
} as const;

interface RunTimelineProps {
  runs: RunTimelineItem[];
  unavailable: boolean;
  onOpenHealth: () => void;
}

export function RunTimeline({
  runs,
  unavailable,
  onOpenHealth,
}: RunTimelineProps): React.JSX.Element {
  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <header className="panel-header compact-header">
        <div>
          <span className="panel-kicker">What Mira did over time</span>
          <h2 id="timeline-title">Independent scans</h2>
        </div>
      </header>

      {unavailable || runs.length === 0 ? (
        <div className="timeline-empty">
          <p>
            {unavailable
              ? "Run telemetry is temporarily unavailable."
              : "The first scheduled run has not completed yet."}
          </p>
        </div>
      ) : (
        <ol className="timeline-list">
          {runs.slice(0, 8).map((run) => {
            return (
              <li key={run.id} className={`timeline-${run.status}`}>
                <div className="timeline-marker" aria-hidden="true" />
                <div className="timeline-content">
                  <div className="timeline-title-row">
                    <strong>{statusLabel[run.status]}</strong>
                    <time dateTime={run.startedAt}>
                      {formatCompactUtc(run.startedAt)}
                    </time>
                  </div>
                  <p>{run.summary}</p>
                  <div className="run-counts">
                    <span>{run.discovered} discovered</span>
                    <span>{run.rejected} rejected</span>
                    <span>{run.published} published</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <button className="architecture-link" type="button" onClick={onOpenHealth}>
        Open runtime health
        <span>↗</span>
      </button>
    </section>
  );
}

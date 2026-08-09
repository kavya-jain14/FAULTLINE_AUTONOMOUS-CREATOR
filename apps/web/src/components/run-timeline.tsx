import { Activity, Check, LoaderCircle, TriangleAlert, X } from "lucide-react";
import type { RunTimelineItem } from "@faultline/contracts";

import { formatCompactUtc } from "../lib/time";

const statusIcon = {
  completed: Check,
  running: LoaderCircle,
  partial: TriangleAlert,
  failed: X,
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
          <span className="panel-kicker">Proof of continuity</span>
          <h2 id="timeline-title">Autonomous runs</h2>
        </div>
        <Activity />
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
            const Icon = statusIcon[run.status];
            return (
              <li key={run.id} className={`timeline-${run.status}`}>
                <div className="timeline-marker">
                  <Icon />
                </div>
                <div className="timeline-content">
                  <div className="timeline-title-row">
                    <strong>{run.status}</strong>
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
        Inspect architecture &amp; system health
        <span>↗</span>
      </button>
    </section>
  );
}

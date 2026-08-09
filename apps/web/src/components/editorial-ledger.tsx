import { ArrowUpRight, Ban, Scale } from "lucide-react";
import type { EditorialLedgerItem } from "@faultline/contracts";

import { formatCompactUtc, sourceLabel } from "../lib/time";

interface EditorialLedgerProps {
  items: EditorialLedgerItem[];
  unavailable: boolean;
}

export function EditorialLedger({
  items,
  unavailable,
}: EditorialLedgerProps): React.JSX.Element {
  return (
    <section className="panel ledger-panel" aria-labelledby="ledger-title">
      <header className="panel-header ledger-heading">
        <div>
          <span className="panel-kicker">Intentional silence</span>
          <h2 id="ledger-title">Editorial ledger</h2>
        </div>
        <span className="threshold-note">
          <Scale /> Publish threshold 72
        </span>
      </header>

      {unavailable ? (
        <div className="compact-empty">
          <p>Rejection evidence is unavailable while telemetry is degraded.</p>
        </div>
      ) : null}

      {!unavailable && items.length === 0 ? (
        <div className="compact-empty">
          <Ban />
          <p>No rejected candidates have been recorded yet.</p>
        </div>
      ) : null}

      <div className="ledger-list">
        {items.map((item) => (
          <article className="ledger-item" key={item.id}>
            <div className="ledger-verdict" aria-label="Rejected">
              <Ban /> Rejected
            </div>
            <div className="ledger-main">
              <h3>{item.title}</h3>
              <p>{item.reason}</p>
              <div className="ledger-meta">
                <time dateTime={item.decidedAt}>
                  {formatCompactUtc(item.decidedAt)}
                </time>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  {sourceLabel(item.sourceUrl)} <ArrowUpRight />
                </a>
              </div>
            </div>
            <div
              className={`score-badge ${item.finalScore >= 60 ? "score-near" : ""}`}
              aria-label={`Editorial score ${item.finalScore} out of 100`}
            >
              <strong>{item.finalScore}</strong>
              <span>/100</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

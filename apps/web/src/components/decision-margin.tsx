import type { EditorialLedgerItem } from "@faultline/contracts";

interface DecisionMarginProps {
  items: EditorialLedgerItem[];
  totalRejected: number;
  unavailable: boolean;
  onShowAll: () => void;
}

function conciseReason(reason: string): string {
  return reason
    .replace(/^Rejected because\s+/i, "")
    .replace(/^Rejected by hard gate:\s*/i, "")
    .replace(/^Rejected at \d+\/100:\s*/i, "")
    .replace(/\.$/, "")
    .trim();
}

export function DecisionMargin({
  items,
  totalRejected,
  unavailable,
  onShowAll,
}: DecisionMarginProps): React.JSX.Element {
  return (
    <section className="decision-margin" aria-labelledby="decision-margin-title">
      <header>
        <span className="panel-kicker">Judgment, visible</span>
        <h2 id="decision-margin-title">
          {totalRejected === 0
            ? "Nothing withheld yet"
            : `${totalRejected} ${totalRejected === 1 ? "topic" : "topics"} stayed out`}
        </h2>
        <p>New is not the same as useful. Silence is a valid editorial decision.</p>
      </header>

      {unavailable ? (
        <p className="margin-empty">Recent decisions are temporarily unavailable.</p>
      ) : null}

      {!unavailable && items.length > 0 ? (
        <ol>
          {items.slice(0, 3).map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{conciseReason(item.reason)}</p>
              </div>
              <span>{item.finalScore}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {!unavailable && items.length === 0 ? (
        <p className="margin-empty">Mira has not completed an editorial pass yet.</p>
      ) : null}

      <button type="button" onClick={onShowAll} disabled={items.length === 0}>
        Open the decision ledger <span>→</span>
      </button>
    </section>
  );
}

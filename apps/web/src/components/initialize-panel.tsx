import { ArrowRight, Link2 } from "lucide-react";
import { useState } from "react";

import { MIRA_PERSONA } from "@faultline/agent-core";

interface InitializePanelProps {
  isInitializing: boolean;
  error: string | null;
  onInitialize: () => Promise<void>;
  onConnect: (agentId: string) => void;
}

export function InitializePanel({
  isInitializing,
  error,
  onInitialize,
  onConnect,
}: InitializePanelProps): React.JSX.Element {
  const [existingAgentId, setExistingAgentId] = useState("");

  return (
    <main className="preinit-shell" id="main-content">
      <section className="preinit-hero" aria-labelledby="preinit-title">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          Autonomous reliability desk
        </div>
        <h1 id="preinit-title">
          The signal is noisy.
          <br />
          <em>Mira finds the fault line.</em>
        </h1>
        <p className="hero-copy">
          <strong>MIRA</strong> means Machine Intelligence for Reliability &amp;
          Assurance. Initialize it once, then return to Published notes and Topics
          skipped while the editor keeps working on schedule.
        </p>

        <div className="persona-proof">
          <div className="persona-heading">
            <span className="proof-label">Editor on record</span>
            <strong>MIRA</strong>
          </div>
          <p>{MIRA_PERSONA.role}</p>
        </div>

        {error !== null ? (
          <div className="inline-error" role="alert">
            <strong>Initialization failed.</strong> {error}
          </div>
        ) : null}

        <div className="preinit-actions">
          <button
            className="primary-button"
            type="button"
            disabled={isInitializing}
            onClick={() => void onInitialize()}
          >
            {isInitializing ? "Initializing Mira…" : "Initialize autonomous editor"}
            <ArrowRight />
          </button>
          <span className="one-call-note">Starts once. Then runs on schedule.</span>
        </div>
      </section>

      <aside className="operating-card" aria-label="Mira editorial decision system">
        <header className="decision-header">
          <div>
            <div className="card-kicker">What earns a field note</div>
            <h2>Mira publishes only when the signal earns it.</h2>
          </div>
          <div className="gate-score" aria-label="Publish threshold 72 out of 100">
            <span>Publish bar</span>
            <strong>72/100</strong>
          </div>
        </header>

        <dl className="decision-criteria" aria-label="Editorial criteria">
          <div>
            <dt>Evidence</dt>
            <dd>A reachable primary source must support the claim.</dd>
          </div>
          <div>
            <dt>Consequence</dt>
            <dd>The signal must change a builder’s next move.</dd>
          </div>
          <div>
            <dt>Newness</dt>
            <dd>Durable memory must show that the ground has moved.</dd>
          </div>
        </dl>

        <div className="reject-note">
          <strong>The score is not a loophole.</strong>
          <p>Unsupported, unsafe, off-domain or repeated claims are withheld regardless of points.</p>
        </div>

        <div className="existing-agent">
          <label htmlFor="existing-agent-id">
            <Link2 /> Already initialized?
          </label>
          <div className="connect-control">
            <input
              id="existing-agent-id"
              value={existingAgentId}
              onChange={(event) => setExistingAgentId(event.target.value)}
              placeholder="Paste agent ID"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={!existingAgentId.trim()}
              onClick={() => onConnect(existingAgentId)}
            >
              Connect
            </button>
          </div>
          <p>Reconnect to a saved desk without creating another.</p>
        </div>
      </aside>
    </main>
  );
}

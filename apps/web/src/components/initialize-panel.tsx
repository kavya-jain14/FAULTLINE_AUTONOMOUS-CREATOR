import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
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
          An autonomous AI reliability and security editor that discovers,
          judges, remembers, and publishes without waiting for another prompt.
        </p>

        <div className="persona-proof">
          <div className="mira-monogram" aria-hidden="true">
            M
          </div>
          <div>
            <span className="proof-label">Editorial identity</span>
            <strong>Mira</strong>
            <p>{MIRA_PERSONA.role}</p>
          </div>
          <ShieldCheck aria-label="Persona locked" />
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
          <span className="one-call-note">One durable initialization call</span>
        </div>
      </section>

      <aside className="operating-card" aria-label="Mira editorial decision system">
        <header className="decision-header">
          <div>
            <div className="card-kicker">Mira’s editorial gate</div>
            <h2>Judgment before generation.</h2>
          </div>
          <div className="gate-score" aria-label="Publish threshold 72 out of 100">
            <strong>72</strong>
            <span>publish bar</span>
          </div>
        </header>

        <div className="discovery-rail">
          <span>01 · Discover</span>
          <p>Primary technical sources enter as untrusted evidence.</p>
        </div>

        <section className="judgment-gate" aria-labelledby="judgment-title">
          <div className="gate-label">
            <span>02</span>
            <h3 id="judgment-title">Decision evidence</h3>
          </div>
          <dl className="decision-factors">
            <div>
              <dt>Evidence quality</dt>
              <dd>Required</dd>
            </div>
            <div>
              <dt>Builder consequence</dt>
              <dd>Material</dd>
            </div>
            <div>
              <dt>Novel vs memory</dt>
              <dd>Distinct</dd>
            </div>
          </dl>
          <div className="reject-row">
            <strong>Hard reject</strong>
            <span>Unsupported</span>
            <span>Repeated</span>
            <span>No consequence</span>
          </div>
        </section>

        <div className="after-gate">
          <article>
            <span>03</span>
            <div>
              <strong>Remember</strong>
              <p>Check durable coverage before writing.</p>
            </div>
          </article>
          <article>
            <span>04</span>
            <div>
              <strong>Publish</strong>
              <p>Append only qualified field notes.</p>
            </div>
          </article>
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
          <p>Connects this view only. It never initializes a second agent.</p>
        </div>
      </aside>
    </main>
  );
}

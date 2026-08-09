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
          <div className="persona-heading">
            <span className="proof-label">Editor on record</span>
            <strong>Mira</strong>
          </div>
          <p>{MIRA_PERSONA.role}</p>
          <div className="persona-lock">
            <ShieldCheck aria-hidden="true" />
            <span>
              Identity fixed
              <small>Voice consistent</small>
            </span>
          </div>
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
            <div className="card-kicker">The editorial standard</div>
            <h2>Mira publishes only when the signal earns it.</h2>
          </div>
          <div className="gate-score" aria-label="Publish threshold 72 out of 100">
            <strong>72</strong>
            <span>minimum</span>
          </div>
        </header>

        <section className="decision-route" aria-label="Autonomous editorial route">
          <article>
            <span>01</span>
            <div>
              <strong>Discover</strong>
              <p>Read live primary technical sources.</p>
            </div>
          </article>
          <article className="route-decision">
            <span>02</span>
            <div>
              <strong>Decide</strong>
              <p>Test evidence, builder consequence, and novelty.</p>
            </div>
            <em>72+ continues</em>
          </article>
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
              <p>Append a sourced field note with its rationale.</p>
            </div>
          </article>
        </section>

        <div className="reject-note">
          <strong>Below the line</strong>
          <p>Unsupported · repeated · no builder consequence</p>
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

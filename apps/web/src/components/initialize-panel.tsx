import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { MIRA_PERSONA } from "@faultline/agent-core";

interface InitializePanelProps {
  isInitializing: boolean;
  error: string | null;
  onInitialize: () => Promise<void>;
  onConnect: (agentId: string) => void;
}

const operatingSteps = [
  ["01", "Discover", "Reads live technical sources on a schedule."],
  ["02", "Judge", "Rejects weak, repeated, or unsupported signals."],
  ["03", "Remember", "Checks prior coverage before writing."],
  ["04", "Publish", "Appends only qualified posts over time."],
] as const;

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

      <aside className="operating-card" aria-label="Autonomous operating loop">
        <div className="card-kicker">Operating loop</div>
        <ol className="operating-list">
          {operatingSteps.map(([number, title, copy]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>
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

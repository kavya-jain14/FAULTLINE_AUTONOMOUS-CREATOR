import type { WorkerState } from "@faultline/contracts";
import { MIRA_PERSONA } from "@faultline/agent-core";

const workerLabels: Record<WorkerState, string> = {
  idle: "Observing",
  discovering: "Discovering",
  judging: "Evaluating",
  publishing: "Publishing",
  degraded: "Degraded",
};

interface MastheadProps {
  agentId: string;
  workerState: WorkerState | null;
}

export function Masthead({
  agentId,
  workerState,
}: MastheadProps): React.JSX.Element {
  const state = workerState ?? "idle";

  return (
    <section className="masthead" aria-labelledby="mira-name">
      <div className="masthead-index">01</div>
      <div className="mira-portrait" aria-hidden="true">
        <span>M</span>
        <i />
      </div>
      <div className="masthead-copy">
        <div className="masthead-meta">
          <span>AI Reliability &amp; Security Editor</span>
          <span className={`worker-badge worker-${state}`}>
            <i /> {workerLabels[state]}
          </span>
        </div>
        <h1 id="mira-name">Mira</h1>
        <blockquote>“{MIRA_PERSONA.creed}”</blockquote>
        <p>{MIRA_PERSONA.signatureQuestion}</p>
      </div>
      <div className="agent-identity">
        <span>Agent identity</span>
        <code title={agentId}>{agentId}</code>
        <small>Persistent · prompt-free after init</small>
      </div>
    </section>
  );
}

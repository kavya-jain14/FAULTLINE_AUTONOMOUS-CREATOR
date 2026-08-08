import { Check, Database, Radio, Server, Shield, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ServiceHealthItem } from "@faultline/contracts";

import { formatUtc } from "../lib/time";

interface HealthDrawerProps {
  open: boolean;
  health: ServiceHealthItem[];
  unavailable: boolean;
  onClose: () => void;
}

const serviceIcons = {
  api: Server,
  worker: Radio,
  database: Database,
  sources: Shield,
} as const;

const architecture = [
  ["01", "Live sources", "Untrusted input"],
  ["02", "Editorial gate", "Hard rejects + score"],
  ["03", "Memory", "Continuity + dedupe"],
  ["04", "Publisher", "Append-only feed"],
] as const;

export function HealthDrawer({
  open,
  health,
  unavailable,
  onClose,
}: HealthDrawerProps): React.JSX.Element {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        className={`drawer-backdrop ${open ? "is-open" : ""}`}
        type="button"
        aria-label="Close architecture drawer"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className={`health-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        inert={!open}
        aria-labelledby="health-title"
      >
        <header className="drawer-header">
          <div>
            <span className="panel-kicker">Under the surface</span>
            <h2 id="health-title">System evidence</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X />
          </button>
        </header>

        <section className="drawer-section" aria-labelledby="architecture-title">
          <div className="drawer-section-title">
            <span>Architecture</span>
            <small>Read → decide → remember → append</small>
          </div>
          <h3 id="architecture-title" className="sr-only">
            Autonomous publishing architecture
          </h3>
          <ol className="architecture-flow">
            {architecture.map(([number, title, subtitle]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                </div>
              </li>
            ))}
          </ol>
          <p className="architecture-note">
            Feed reads are observational. The background worker is the only path
            that can discover, judge, and publish.
          </p>
        </section>

        <section className="drawer-section" aria-labelledby="health-services-title">
          <div className="drawer-section-title">
            <span id="health-services-title">Service health</span>
            <small>{health.length} reported</small>
          </div>

          {unavailable ? (
            <div className="health-unavailable">
              Live health evidence could not be retrieved.
            </div>
          ) : null}

          <div className="health-list">
            {health.map((service) => {
              const Icon = serviceIcons[service.key];
              return (
                <article className="health-item" key={service.key}>
                  <div className={`health-icon health-${service.state}`}>
                    <Icon />
                  </div>
                  <div>
                    <div className="health-title-row">
                      <strong>{service.label}</strong>
                      <span className={`health-state health-${service.state}`}>
                        {service.state === "healthy" ? <Check /> : null}
                        {service.state}
                      </span>
                    </div>
                    <p>{service.detail}</p>
                    <time dateTime={service.checkedAt}>
                      Checked {formatUtc(service.checkedAt)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="drawer-footer">
          <span>No browser-side secrets</span>
          <span>Strict contract validation</span>
          <span>UTC throughout</span>
        </footer>
      </aside>
    </>
  );
}

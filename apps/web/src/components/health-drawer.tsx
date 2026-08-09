import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ServiceHealthItem } from "@faultline/contracts";

import { formatUtc } from "../lib/time";

interface HealthDrawerProps {
  open: boolean;
  health: ServiceHealthItem[];
  unavailable: boolean;
  onClose: () => void;
}

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
        aria-label="Close runtime drawer"
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
            <span className="panel-kicker">Operational evidence</span>
            <h2 id="health-title">Runtime health</h2>
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
              return (
                <article className="health-item" key={service.key}>
                  <div>
                    <div className="health-title-row">
                      <strong>
                        <i className={`health-dot health-${service.state}`} />
                        {service.label}
                      </strong>
                      <span className={`health-state health-${service.state}`}>
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
          <span>Server scheduler</span>
          <span>Durable memory</span>
          <span>UTC records</span>
        </footer>
      </aside>
    </>
  );
}

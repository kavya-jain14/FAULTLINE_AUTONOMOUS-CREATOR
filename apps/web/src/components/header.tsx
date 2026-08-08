import { CircleHelp, RefreshCw, Unplug } from "lucide-react";

import { BrandMark } from "./brand-mark";

interface HeaderProps {
  connected: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
  onOpenHealth: () => void;
}

export function Header({
  connected,
  isRefreshing,
  onRefresh,
  onDisconnect,
  onOpenHealth,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="FAULTLINE home">
        <BrandMark />
        <span className="brand-word">FAULTLINE</span>
        <span className="brand-edition">Field note 01</span>
      </a>

      <div className="header-actions">
        <span className="utc-label">All times UTC</span>
        {connected ? (
          <>
            <button
              className="icon-button"
              type="button"
              onClick={onRefresh}
              aria-label="Refresh feed and telemetry"
              title="Refresh read-only data"
            >
              <RefreshCw className={isRefreshing ? "is-spinning" : ""} />
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={onOpenHealth}
              aria-label="Open architecture and health"
              title="Architecture and health"
            >
              <CircleHelp />
            </button>
            <button
              className="text-button header-disconnect"
              type="button"
              onClick={onDisconnect}
            >
              <Unplug />
              Disconnect view
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

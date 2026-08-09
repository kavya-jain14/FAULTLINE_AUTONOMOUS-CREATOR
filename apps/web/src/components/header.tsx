import { CircleHelp, Moon, RefreshCw, Sun, Unplug } from "lucide-react";

import { MiraMark } from "./mira-mark";

interface HeaderProps {
  connected: boolean;
  theme: "light" | "dark";
  isRefreshing: boolean;
  onRefresh: () => void;
  onDisconnect: () => void;
  onOpenHealth: () => void;
  onToggleTheme: () => void;
}

export function Header({
  connected,
  theme,
  isRefreshing,
  onRefresh,
  onDisconnect,
  onOpenHealth,
  onToggleTheme,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="MIRA home">
        <MiraMark />
        <span className="brand-word">MIRA</span>
        <span className="brand-edition">Reliability desk</span>
      </a>

      <div className="header-actions">
        <span className="utc-label">All times UTC</span>
        <button
          className="text-button theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon /> : <Sun />}
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>
        {connected ? (
          <>
            <button
              className="icon-button header-refresh"
              type="button"
              onClick={onRefresh}
              aria-label="Refresh feed and telemetry"
              title="Refresh read-only data"
            >
              <RefreshCw className={isRefreshing ? "is-spinning" : ""} />
            </button>
            <button
              className="icon-button header-health"
              type="button"
              onClick={onOpenHealth}
              aria-label="Open runtime health"
              title="Runtime health"
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

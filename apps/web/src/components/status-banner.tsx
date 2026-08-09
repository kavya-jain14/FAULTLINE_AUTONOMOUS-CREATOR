import { AlertTriangle, CloudOff, RotateCcw } from "lucide-react";

interface StatusBannerProps {
  feedError: string | null;
  telemetryError: string | null;
  onRetry: () => void;
}

export function StatusBanner({
  feedError,
  telemetryError,
  onRetry,
}: StatusBannerProps): React.JSX.Element | null {
  if (feedError === null && telemetryError === null) return null;
  const feedUnavailable = feedError !== null;

  return (
    <div
      className={`status-banner ${feedUnavailable ? "status-error" : "status-warning"}`}
      role={feedUnavailable ? "alert" : "status"}
    >
      {feedUnavailable ? <CloudOff /> : <AlertTriangle />}
      <div>
        <strong>
          {feedUnavailable
            ? "Published feed is temporarily unavailable"
            : "Operational telemetry is degraded"}
        </strong>
        <p>
          {feedUnavailable
            ? feedError
            : `${telemetryError} Published posts remain readable.`}
        </p>
      </div>
      <button type="button" onClick={onRetry}>
        <RotateCcw /> Retry
      </button>
    </div>
  );
}

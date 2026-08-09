const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function formatUtc(timestamp: string | null): string {
  if (timestamp === null) return "Not run yet";
  return `${utcFormatter.format(new Date(timestamp))} UTC`;
}

export function formatCompactUtc(timestamp: string): string {
  return utcFormatter
    .format(new Date(timestamp))
    .replace(/,?\s(\d{4}),?/, " · $1 ·");
}

export function timeUntil(timestamp: string | null): string {
  if (timestamp === null) return "Awaiting schedule";
  const deltaMinutes = Math.round((Date.parse(timestamp) - Date.now()) / 60_000);
  if (deltaMinutes <= 0) return "Due now";
  if (deltaMinutes < 60) return `in ${deltaMinutes}m`;
  const hours = Math.floor(deltaMinutes / 60);
  const minutes = deltaMinutes % 60;
  return minutes === 0 ? `in ${hours}h` : `in ${hours}h ${minutes}m`;
}

export function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

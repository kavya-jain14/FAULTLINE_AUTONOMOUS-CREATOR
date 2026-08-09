function readDuration(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

export interface RuntimeConfig {
  initialDelayMs: number;
  intervalMs: number;
  failureRetryMs: number;
  pollMs: number;
  scheduleJitterMs: number;
  leaseMs: number;
  sourceTimeoutMs: number;
  sourceRetries: number;
  maxPostsPerRun: number;
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    initialDelayMs: readDuration(
      "FAULTLINE_INITIAL_DELAY_MS",
      8_000,
      100,
      10 * 60_000,
    ),
    intervalMs: readDuration(
      "FAULTLINE_INTERVAL_MS",
      30 * 60_000,
      1_000,
      24 * 60 * 60_000,
    ),
    failureRetryMs: readDuration(
      "FAULTLINE_FAILURE_RETRY_MS",
      5 * 60_000,
      1_000,
      60 * 60_000,
    ),
    pollMs: readDuration(
      "FAULTLINE_POLL_MS",
      2_000,
      100,
      60_000,
    ),
    scheduleJitterMs: readDuration(
      "FAULTLINE_SCHEDULE_JITTER_MS",
      2 * 60_000,
      0,
      15 * 60_000,
    ),
    leaseMs: readDuration(
      "FAULTLINE_LEASE_MS",
      2 * 60_000,
      10_000,
      30 * 60_000,
    ),
    sourceTimeoutMs: readDuration(
      "FAULTLINE_SOURCE_TIMEOUT_MS",
      12_000,
      1_000,
      60_000,
    ),
    sourceRetries: readDuration(
      "FAULTLINE_SOURCE_RETRIES",
      1,
      0,
      3,
    ),
    maxPostsPerRun: readDuration(
      "FAULTLINE_MAX_POSTS_PER_RUN",
      1,
      1,
      3,
    ),
  };
}

export function scheduleAt(
  delayMs: number,
  jitterMs = 0,
  from = new Date(),
  random = Math.random,
): string {
  const jitter =
    jitterMs === 0
      ? 0
      : Math.round((random() * 2 - 1) * jitterMs);

  return new Date(
    from.getTime() + Math.max(100, delayMs + jitter),
  ).toISOString();
}

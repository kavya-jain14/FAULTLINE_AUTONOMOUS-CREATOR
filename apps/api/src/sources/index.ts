import { getRuntimeConfig } from "../config.js";
import { CertInAdapter } from "./cert-in.js";
import { GitHubAdvisoryAdapter } from "./github-advisories.js";
import { NvdAdapter } from "./nvd.js";
import type { SourceAdapter, SourceCandidate } from "./types.js";

export interface SourceFetchResult {
  source: string;
  label: string;
  candidates: SourceCandidate[];
  error: string | null;
  checkedAt: string;
  attempts: number;
}

export interface SourceRegistryOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class SourceRegistry {
  private readonly adapters: SourceAdapter[];
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  constructor(
    adapters: SourceAdapter[] = [
      new GitHubAdvisoryAdapter(),
      new NvdAdapter(),
      new CertInAdapter(),
    ],
    options: SourceRegistryOptions = {},
  ) {
    const runtime = getRuntimeConfig();
    this.adapters = adapters;
    this.timeoutMs = options.timeoutMs ?? runtime.sourceTimeoutMs;
    this.retries = options.retries ?? runtime.sourceRetries;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  listSources(): string[] {
    return this.adapters.map((adapter) => adapter.kind);
  }

  private async fetchAdapter(
    adapter: SourceAdapter,
    outerSignal?: AbortSignal,
  ): Promise<SourceFetchResult> {
    let lastError = "Unknown source failure.";

    for (let attempt = 1; attempt <= this.retries + 1; attempt += 1) {
      try {
        const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
        const signal = outerSignal
          ? AbortSignal.any([outerSignal, timeoutSignal])
          : timeoutSignal;
        const candidates = await adapter.fetchCandidates(signal);

        return {
          source: adapter.kind,
          label: adapter.name,
          candidates,
          error: null,
          checkedAt: new Date().toISOString(),
          attempts: attempt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempt <= this.retries && !outerSignal?.aborted) {
          await wait(this.retryDelayMs * attempt);
        }
      }
    }

    return {
      source: adapter.kind,
      label: adapter.name,
      candidates: [],
      error: lastError,
      checkedAt: new Date().toISOString(),
      attempts: this.retries + 1,
    };
  }

  async fetchAll(signal?: AbortSignal): Promise<SourceFetchResult[]> {
    return Promise.all(
      this.adapters.map((adapter) => this.fetchAdapter(adapter, signal)),
    );
  }
}

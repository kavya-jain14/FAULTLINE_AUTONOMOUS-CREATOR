import { CertInAdapter } from "./cert-in.js";
import { CisaKevAdapter } from "./cisa-kev.js";
import { NvdAdapter } from "./nvd.js";

import type {
  SourceAdapter,
  SourceCandidate,
} from "./types.js";

export interface SourceFetchResult {
  source: string;
  candidates: SourceCandidate[];
  error: string | null;
}

export class SourceRegistry {
  private readonly adapters: SourceAdapter[];

  constructor(
    adapters: SourceAdapter[] = [
      new CisaKevAdapter(),
      new NvdAdapter(),
      new CertInAdapter(),
    ],
  ) {
    this.adapters = adapters;
  }

  listSources(): string[] {
    return this.adapters.map(
      (adapter) => adapter.kind,
    );
  }

  async fetchAll(
    signal?: AbortSignal,
  ): Promise<SourceFetchResult[]> {
    const results = await Promise.all(
      this.adapters.map(async (adapter) => {
        try {
          const candidates =
            await adapter.fetchCandidates(signal);

          return {
            source: adapter.kind,
            candidates,
            error: null,
          };
        } catch (error) {
          return {
            source: adapter.kind,
            candidates: [],
            error:
              error instanceof Error
                ? error.message
                : String(error),
          };
        }
      }),
    );

    return results;
  }
}
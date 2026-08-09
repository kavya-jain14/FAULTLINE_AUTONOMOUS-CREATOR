import type { SourceCandidate } from "../sources/types.js";

export interface MemoryRecord {
  fingerprint: string;
  sourceId: string;
  title: string;
  sourceKind: string;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
}

export interface MemoryStore {
  has(fingerprint: string): boolean;

  remember(
    candidate: SourceCandidate,
    fingerprint: string,
  ): MemoryRecord;

  get(
    fingerprint: string,
  ): MemoryRecord | undefined;

  size(): number;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createFingerprint(
  candidate: SourceCandidate,
): string {
  const sourceId = normalizeText(
    candidate.sourceId,
  );

  const title = normalizeText(
    candidate.title,
  );

  return `${candidate.sourceKind}:${sourceId}:${title}`;
}

export class EditorialMemory implements MemoryStore {
  private readonly records = new Map<
    string,
    MemoryRecord
  >();

  has(fingerprint: string): boolean {
    return this.records.has(fingerprint);
  }

  remember(
    candidate: SourceCandidate,
    fingerprint: string,
  ): MemoryRecord {
    const now = new Date().toISOString();

    const existing =
      this.records.get(fingerprint);

    if (existing) {
      const updated: MemoryRecord = {
        ...existing,
        lastSeenAt: now,
        seenCount: existing.seenCount + 1,
      };

      this.records.set(
        fingerprint,
        updated,
      );

      return updated;
    }

    const record: MemoryRecord = {
      fingerprint,
      sourceId: candidate.sourceId,
      title: candidate.title,
      sourceKind: candidate.sourceKind,
      firstSeenAt: now,
      lastSeenAt: now,
      seenCount: 1,
    };

    this.records.set(
      fingerprint,
      record,
    );

    return record;
  }

  get(
    fingerprint: string,
  ): MemoryRecord | undefined {
    return this.records.get(fingerprint);
  }

  size(): number {
    return this.records.size;
  }
}
export type SourceKind =
  | "nvd"
  | "cert-in"
  | "github-advisory";

export interface SourceCandidate {
  sourceId: string;
  sourceKind: SourceKind;

  title: string;
  summary: string;

  url: string;
  publishedAt: string;

  sourceName: string;

  tags: string[];

  rawContent?: string;
}

export interface SourceAdapter {
  readonly kind: SourceKind;
  readonly name: string;

  fetchCandidates(
    signal?: AbortSignal,
  ): Promise<SourceCandidate[]>;
}

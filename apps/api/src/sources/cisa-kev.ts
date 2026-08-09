import type {
  SourceAdapter,
  SourceCandidate,
} from "./types.js";

interface CisaKevRecord {
  cveID?: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  requiredAction?: string;
}

interface CisaKevResponse {
  vulnerabilities?: CisaKevRecord[];
}

export class CisaKevAdapter implements SourceAdapter {
  readonly kind = "cisa-kev" as const;

  readonly name =
    "CISA Known Exploited Vulnerabilities";

  private readonly endpoint =
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

  async fetchCandidates(
    signal?: AbortSignal,
  ): Promise<SourceCandidate[]> {
    const response = await fetch(this.endpoint, {
      signal,
      headers: {
        Accept: "application/json",
        "User-Agent":
          "FAULTLINE-Autonomous-Creator/0.1",
      },
    });

    if (!response.ok) {
      throw new Error(
        `CISA request failed: ${response.status}`,
      );
    }

    const data =
      (await response.json()) as CisaKevResponse;

    const vulnerabilities =
      data.vulnerabilities ?? [];

    return vulnerabilities.slice(0, 25).map(
      (item, index) => ({
        sourceId:
          item.cveID ??
          `cisa-${Date.now()}-${index}`,

        sourceKind: "cisa-kev",

        title:
          item.vulnerabilityName ??
          item.cveID ??
          "CISA vulnerability",

        summary:
          item.shortDescription ??
          "Known exploited vulnerability listed by CISA.",

        url: this.endpoint,

        publishedAt:
          item.dateAdded ??
          new Date().toISOString(),

        sourceName: this.name,

        tags: [
          "cybersecurity",
          "vulnerability",
          "exploited",
          ...(item.vendorProject
            ? [item.vendorProject]
            : []),
          ...(item.product
            ? [item.product]
            : []),
        ],

        rawContent: [
          item.shortDescription,
          item.requiredAction,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    );
  }
}
import type {
  SourceAdapter,
  SourceCandidate,
} from "./types.js";

interface NvdCve {
  id?: string;
  published?: string;
  lastModified?: string;
  descriptions?: Array<{
    lang?: string;
    value?: string;
  }>;
}

interface NvdVulnerability {
  cve?: NvdCve;
}

interface NvdResponse {
  vulnerabilities?: NvdVulnerability[];
}

export class NvdAdapter implements SourceAdapter {
  readonly kind = "nvd" as const;

  readonly name =
    "National Vulnerability Database";

  private readonly endpoint =
    "https://services.nvd.nist.gov/rest/json/cves/2.0";

  async fetchCandidates(
    signal?: AbortSignal,
  ): Promise<SourceCandidate[]> {
    const response = await fetch(
      `${this.endpoint}?resultsPerPage=25`,
      {
        signal,
        headers: {
          Accept: "application/json",
          "User-Agent":
            "FAULTLINE-Autonomous-Creator/0.1",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `NVD request failed: ${response.status}`,
      );
    }

    const data =
      (await response.json()) as NvdResponse;

    const vulnerabilities =
      data.vulnerabilities ?? [];

    return vulnerabilities
      .filter((item) => item.cve?.id)
      .map((item) => {
        const cve = item.cve!;

        const description =
          cve.descriptions?.find(
            (entry) => entry.lang === "en",
          )?.value ??
          cve.descriptions?.[0]?.value ??
          "NVD vulnerability record.";

        return {
          sourceId: cve.id!,
          sourceKind: "nvd" as const,
          title: cve.id!,
          summary: description,
          url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
          publishedAt:
            cve.published ??
            cve.lastModified ??
            new Date().toISOString(),
          sourceName: this.name,
          tags: [
            "cybersecurity",
            "vulnerability",
            "nvd",
          ],
          rawContent: description,
        };
      });
  }
}
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

function utcTimestamp(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const parsed = Date.parse(zoned);
  return Number.isFinite(parsed)
    ? new Date(parsed).toISOString()
    : new Date().toISOString();
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
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60_000);
    const query = new URLSearchParams({
      resultsPerPage: "20",
      lastModStartDate: start.toISOString(),
      lastModEndDate: end.toISOString(),
    });
    const response = await fetch(
      `${this.endpoint}?${query.toString()}`,
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

    const vulnerabilities = [...(data.vulnerabilities ?? [])]
      .sort((left, right) =>
        String(right.cve?.lastModified ?? right.cve?.published ?? "").localeCompare(
          String(left.cve?.lastModified ?? left.cve?.published ?? ""),
        ),
      )
      .slice(0, 12);

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
          title: `${cve.id!} — ${description.slice(0, 110)}`,
          summary: description,
          url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
          publishedAt: utcTimestamp(cve.lastModified ?? cve.published),
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

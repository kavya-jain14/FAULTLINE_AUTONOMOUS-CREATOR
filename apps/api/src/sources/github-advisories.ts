import type { SourceAdapter, SourceCandidate } from "./types.js";

interface GitHubAdvisory {
  ghsa_id?: string;
  cve_id?: string | null;
  html_url?: string;
  summary?: string;
  description?: string;
  severity?: string;
  published_at?: string;
  updated_at?: string;
  vulnerabilities?: Array<{
    package?: {
      ecosystem?: string;
      name?: string;
    };
    vulnerable_version_range?: string;
    first_patched_version?: string | null;
  }>;
}

export class GitHubAdvisoryAdapter implements SourceAdapter {
  readonly kind = "github-advisory" as const;
  readonly name = "GitHub Security Advisories";

  private readonly endpoint =
    "https://api.github.com/advisories?per_page=20&type=reviewed&sort=updated&direction=desc";

  async fetchCandidates(signal?: AbortSignal): Promise<SourceCandidate[]> {
    const response = await fetch(this.endpoint, {
      signal,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "FAULTLINE-Autonomous-Creator/0.2",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub advisory request failed: ${response.status}`);
    }

    const advisories = (await response.json()) as GitHubAdvisory[];

    return advisories
      .filter(
        (item) =>
          item.ghsa_id && item.html_url && item.summary && item.description,
      )
      .slice(0, 12)
      .map((item) => {
        const packages = item.vulnerabilities ?? [];
        const packageSummary = packages
          .slice(0, 4)
          .map((entry) =>
            [
              entry.package?.ecosystem,
              entry.package?.name,
              entry.vulnerable_version_range,
              entry.first_patched_version
                ? `patched in ${entry.first_patched_version}`
                : null,
            ]
              .filter(Boolean)
              .join(" "),
          )
          .filter(Boolean)
          .join("; ");

        return {
          sourceId: item.ghsa_id!,
          sourceKind: "github-advisory" as const,
          title: `${item.ghsa_id!}${item.cve_id ? ` / ${item.cve_id}` : ""} — ${item.summary!}`,
          summary: item.description!.slice(0, 1_500),
          url: item.html_url!,
          publishedAt:
            item.updated_at ?? item.published_at ?? new Date().toISOString(),
          sourceName: this.name,
          tags: [
            "open-source",
            "security",
            "advisory",
            item.severity ?? "unknown-severity",
            ...packages.flatMap((entry) =>
              [entry.package?.ecosystem, entry.package?.name].filter(
                (value): value is string => Boolean(value),
              ),
            ),
          ],
          rawContent: `${item.description!}\nAffected packages: ${packageSummary}`.slice(
            0,
            4_000,
          ),
        } satisfies SourceCandidate;
      });
  }
}

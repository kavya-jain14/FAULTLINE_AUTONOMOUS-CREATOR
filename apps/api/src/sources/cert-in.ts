import type {
  SourceAdapter,
  SourceCandidate,
} from "./types.js";

export class CertInAdapter implements SourceAdapter {
  readonly kind = "cert-in" as const;

  readonly name = "CERT-In Advisories";

  private readonly endpoint =
    "https://www.cert-in.org.in/";

  async fetchCandidates(
    signal?: AbortSignal,
  ): Promise<SourceCandidate[]> {
    const response = await fetch(
      this.endpoint,
      {
        signal,
        headers: {
          Accept: "text/html",
          "User-Agent":
            "FAULTLINE-Autonomous-Creator/0.1",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `CERT-In request failed: ${response.status}`,
      );
    }

    const html = await response.text();

    /*
     * CERT-In's public website is HTML rather than
     * the JSON-style feed used by CISA/NVD.
     *
     * This first adapter deliberately treats the
     * source as an availability/ingestion adapter.
     *
     * We will add structured advisory extraction
     * after confirming the live endpoint works.
     */

    return [
      {
        sourceId: `cert-in-home-${new Date()
          .toISOString()
          .slice(0, 10)}`,

        sourceKind: "cert-in",

        title: "CERT-In public advisory source",

        summary:
          "CERT-In public cybersecurity advisory source.",

        url: this.endpoint,

        publishedAt: new Date().toISOString(),

        sourceName: this.name,

        tags: [
          "cybersecurity",
          "india",
          "cert-in",
        ],

        rawContent: html.slice(0, 5000),
      },
    ];
  }
}
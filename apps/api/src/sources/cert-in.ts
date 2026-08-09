import type { SourceAdapter, SourceCandidate } from "./types.js";

interface ListingItem {
  code: string;
  title: string;
  url: string;
}

function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };

  return value.replace(
    /&(amp|quot|#39|lt|gt|nbsp);/g,
    (match) => entities[match] ?? match,
  );
}

function plainText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function section(text: string, start: RegExp, end: RegExp): string {
  const startMatch = start.exec(text);

  if (!startMatch) {
    return "";
  }

  const remainder = text.slice(startMatch.index + startMatch[0].length);
  const endMatch = end.exec(remainder);
  return remainder.slice(0, endMatch?.index ?? 600).trim();
}

function parseListing(html: string, baseUrl: string): ListingItem[] {
  const pattern = /<a\s+href=['"]([^'"]*(?:PUBVLNOTES01|PUBVLNOTES02)[^'"]*VLCODE=([^'"&]+)[^'"]*)['"][^>]*>[\s\S]*?<\/a>[\s\S]{0,700}?convertHTMLtoText\('([^']+)'\)/gi;
  const seen = new Set<string>();
  const items: ListingItem[] = [];

  for (const match of html.matchAll(pattern)) {
    const [, path, code, rawTitle] = match;

    if (!path || !code || !rawTitle || seen.has(code)) {
      continue;
    }

    seen.add(code);
    items.push({
      code,
      title: plainText(rawTitle),
      url: new URL(path, baseUrl).toString(),
    });

    if (items.length === 6) {
      break;
    }
  }

  return items;
}

function parseDate(text: string): string {
  const match = text.match(
    /Original Issue Date:\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i,
  );
  const parsed = match?.[1] ? Date.parse(`${match[1]} UTC`) : Number.NaN;
  return Number.isFinite(parsed)
    ? new Date(parsed).toISOString()
    : new Date().toISOString();
}

export class CertInAdapter implements SourceAdapter {
  readonly kind = "cert-in" as const;
  readonly name = "CERT-In Advisories";

  private readonly baseUrl = "https://www.cert-in.org.in/";
  private readonly endpoint = new URL(
    "s2cMainServlet?pageid=PUBWEL01",
    this.baseUrl,
  ).toString();

  private async fetchDetail(
    item: ListingItem,
    signal?: AbortSignal,
  ): Promise<SourceCandidate> {
    const response = await fetch(item.url, {
      signal,
      headers: {
        Accept: "text/html",
        "User-Agent": "FAULTLINE-Autonomous-Creator/0.2",
      },
    });

    if (!response.ok) {
      throw new Error(`CERT-In detail request failed: ${response.status}`);
    }

    const text = plainText(await response.text());
    const risk = section(text, /Risk Assessment:\s*/i, /Impact Assessment:/i);
    const impact = section(text, /Impact Assessment:\s*/i, /Description/i);
    const description = section(text, /Description\s*/i, /Solution/i);
    const solution = section(text, /Solution\s*/i, /Vendor Information|References|Last Updated/i);
    const summary = [risk, impact, description]
      .filter(Boolean)
      .join(" ")
      .slice(0, 1_500);

    return {
      sourceId: item.code,
      sourceKind: "cert-in",
      title: `${item.code} — ${item.title}`,
      summary:
        summary.length >= 30
          ? summary
          : `CERT-In published ${item.title}, a current technical security advisory for affected operators and builders.`,
      url: item.url,
      publishedAt: parseDate(text),
      sourceName: this.name,
      tags: ["cybersecurity", "india", "cert-in", "advisory"],
      rawContent: [risk, impact, description, solution]
        .filter(Boolean)
        .join("\n")
        .slice(0, 4_000),
    };
  }

  async fetchCandidates(signal?: AbortSignal): Promise<SourceCandidate[]> {
    const response = await fetch(this.endpoint, {
      signal,
      headers: {
        Accept: "text/html",
        "User-Agent": "FAULTLINE-Autonomous-Creator/0.2",
      },
    });

    if (!response.ok) {
      throw new Error(`CERT-In request failed: ${response.status}`);
    }

    const items = parseListing(await response.text(), this.baseUrl);

    if (items.length === 0) {
      throw new Error("CERT-In returned no structured advisories.");
    }

    const results = await Promise.allSettled(
      items.map((item) => this.fetchDetail(item, signal)),
    );
    const candidates = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );

    if (candidates.length === 0) {
      throw new Error("CERT-In advisory details were unavailable.");
    }

    return candidates;
  }
}

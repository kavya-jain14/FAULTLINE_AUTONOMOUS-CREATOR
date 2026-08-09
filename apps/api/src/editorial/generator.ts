import type { SourceCandidate } from "../sources/types.js";
import type { EditorialScore } from "./judge.js";

export interface GeneratedPost {
  headline: string;
  body: string;
  rationale: string[];
  sourceIds: string[];
  sourceUrls: string[];
  generatedAt: string;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSummary(summary: string): string {
  return summary
    .replace(/\s+/g, " ")
    .trim();
}

function buildHeadline(
  candidate: SourceCandidate,
): string {
  const title = cleanTitle(
    candidate.title,
  );

  if (title.length <= 90) {
    return title;
  }

  return `${title.slice(0, 87)}...`;
}

function buildBody(
  candidate: SourceCandidate,
): string {
  const summary = cleanSummary(
    candidate.summary,
  );

  const source =
    candidate.sourceName.trim();

  return [
    summary,
    "",
    `Source: ${source}.`,
    `Published: ${candidate.publishedAt}.`,
  ].join("\n");
}

function buildRationale(
  score: EditorialScore,
): string[] {
  return [
    `Editorial score: ${score.total}/${score.maxScore}.`,
    `Publication threshold: ${score.threshold}/${score.maxScore}.`,
    ...score.rationale,
  ];
}

export function generateMiraPost(
  candidate: SourceCandidate,
  score: EditorialScore,
): GeneratedPost {
  return {
    headline:
      buildHeadline(candidate),

    body:
      buildBody(candidate),

    rationale:
      buildRationale(score),

    sourceIds: [
      candidate.sourceId,
    ],

    sourceUrls: [
      candidate.url,
    ],

    generatedAt:
      new Date().toISOString(),
  };
}
import type { SourceCandidate } from "../sources/types.js";

export interface EditorialScore {
  sourceCredibility: number;
  impact: number;
  novelty: number;
  indiaRelevance: number;
  actionability: number;
  clarity: number;

  total: number;
  maxScore: 72;
  threshold: number;
  accepted: boolean;

  rationale: string[];
}

export interface EditorialDecision {
  candidate: SourceCandidate;
  score: EditorialScore;
}

const ACCEPTANCE_THRESHOLD = 45;

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(
    min,
    Math.min(max, value),
  );
}

function scoreSourceCredibility(
  candidate: SourceCandidate,
): number {
  switch (candidate.sourceKind) {
    case "cert-in":
      return 15;

    case "cisa-kev":
      return 14;

    case "nvd":
      return 13;

    default:
      return 8;
  }
}

function scoreImpact(
  candidate: SourceCandidate,
): number {
  const text = [
    candidate.title,
    candidate.summary,
    candidate.rawContent ?? "",
  ]
    .join(" ")
    .toLowerCase();

  let score = 7;

  if (
    /critical|actively exploited|exploited|zero.?day/i.test(
      text,
    )
  ) {
    score += 5;
  }

  if (
    /remote code execution|command injection|authentication bypass/i.test(
      text,
    )
  ) {
    score += 3;
  }

  return clamp(score, 0, 15);
}

function scoreNovelty(
  candidate: SourceCandidate,
): number {
  const text = [
    candidate.title,
    candidate.summary,
    candidate.rawContent ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (
    /zero.?day|actively exploited|known exploited/i.test(
      text,
    )
  ) {
    return 12;
  }

  if (
    /new vulnerability|newly disclosed|recently discovered/i.test(
      text,
    )
  ) {
    return 10;
  }

  return 6;
}

function scoreIndiaRelevance(
  candidate: SourceCandidate,
): number {
  const text = [
    candidate.title,
    candidate.summary,
    candidate.rawContent ?? "",
    ...candidate.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (
    /india|indian|cert-in|uidai|aadhaar|upi|nic|government of india/i.test(
      text,
    )
  ) {
    return 12;
  }

  return 6;
}

function scoreActionability(
  candidate: SourceCandidate,
): number {
  const text = [
    candidate.title,
    candidate.summary,
    candidate.rawContent ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (
    /patch|update|upgrade|mitigation|remediation|required action|fix/i.test(
      text,
    )
  ) {
    return 10;
  }

  return 5;
}

function scoreClarity(
  candidate: SourceCandidate,
): number {
  const titleLength =
    candidate.title.trim().length;

  const summaryLength =
    candidate.summary.trim().length;

  if (
    titleLength >= 15 &&
    summaryLength >= 80
  ) {
    return 8;
  }

  if (
    titleLength >= 10 &&
    summaryLength >= 40
  ) {
    return 6;
  }

  if (
    titleLength >= 10 &&
    summaryLength >= 20
  ) {
    return 4;
  }

  return 2;
}

export function evaluateEditorialPolicy(
  candidate: SourceCandidate,
): EditorialScore {
  const sourceCredibility =
    scoreSourceCredibility(candidate);

  const impact =
    scoreImpact(candidate);

  const novelty =
    scoreNovelty(candidate);

  const indiaRelevance =
    scoreIndiaRelevance(candidate);

  const actionability =
    scoreActionability(candidate);

  const clarity =
    scoreClarity(candidate);

  const total =
    sourceCredibility +
    impact +
    novelty +
    indiaRelevance +
    actionability +
    clarity;

  const accepted =
    total >= ACCEPTANCE_THRESHOLD;

  const rationale: string[] = [];

  if (sourceCredibility >= 13) {
    rationale.push(
      "Authoritative primary source.",
    );
  }

  if (impact >= 12) {
    rationale.push(
      "High potential security impact.",
    );
  } else if (impact >= 8) {
    rationale.push(
      "Moderate security impact.",
    );
  }

  if (novelty >= 10) {
    rationale.push(
      "Strong novelty or exploitation signal.",
    );
  }

  if (indiaRelevance >= 10) {
    rationale.push(
      "Strong India relevance.",
    );
  }

  if (actionability >= 8) {
    rationale.push(
      "Contains actionable security information.",
    );
  }

  if (clarity >= 6) {
    rationale.push(
      "Source material is sufficiently clear.",
    );
  }

  if (!accepted) {
    rationale.push(
      `Score ${total}/72 is below the publication threshold of ${ACCEPTANCE_THRESHOLD}/72.`,
    );
  } else {
    rationale.push(
      `Score ${total}/72 meets the publication threshold of ${ACCEPTANCE_THRESHOLD}/72.`,
    );
  }

  return {
    sourceCredibility,
    impact,
    novelty,
    indiaRelevance,
    actionability,
    clarity,
    total,
    maxScore: 72,
    threshold: ACCEPTANCE_THRESHOLD,
    accepted,
    rationale,
  };
}

export function judgeCandidate(
  candidate: SourceCandidate,
): EditorialDecision {
  return {
    candidate,
    score:
      evaluateEditorialPolicy(candidate),
  };
}
import {
  PUBLISH_THRESHOLD,
  decideCandidate,
} from "@faultline/agent-core";
import type { HardRejectionCode } from "@faultline/contracts";

import type { SourceCandidate } from "../sources/types.js";

export interface EditorialScore {
  personaRelevance: number;
  practicalImpact: number;
  freshness: number;
  sourceAuthority: number;
  novelty: number;
  insightPotential: number;
  baseScore: number;
  penaltyTotal: number;
  total: number;
  maxScore: 100;
  threshold: number;
  accepted: boolean;
  hardRejections: HardRejectionCode[];
  rationale: string[];
}

export interface EditorialContext {
  personaDomain: string;
  similarityToPublished: number;
  promptInjectionDetected?: boolean;
  now?: Date;
}

export interface EditorialDecision {
  candidate: SourceCandidate;
  score: EditorialScore;
}

function combinedText(candidate: SourceCandidate): string {
  return [
    candidate.title,
    candidate.summary,
    candidate.rawContent ?? "",
    ...candidate.tags,
  ]
    .join(" ")
    .toLowerCase();
}

function scorePersonaRelevance(
  candidate: SourceCandidate,
  personaDomain: string,
): number {
  const text = combinedText(candidate);
  const domain = personaDomain.toLowerCase();
  const securityPersona = /security|reliability|safety|risk/.test(domain);
  const securitySignal =
    /security|vulnerab|exploit|cve-|malware|breach|attack|patch/.test(text);
  const aiPersona = /\bai\b|artificial intelligence|machine learning|model/.test(
    domain,
  );
  const aiSignal =
    /\bai\b|artificial intelligence|machine learning|model|llm|prompt injection/.test(
      text,
    );

  if ((securityPersona && securitySignal) || (aiPersona && aiSignal)) {
    return 20;
  }

  if (securitySignal || aiSignal || /software|cloud|infrastructure|developer/.test(text)) {
    return 14;
  }

  return 5;
}

function scorePracticalImpact(candidate: SourceCandidate): number {
  const text = combinedText(candidate);

  if (
    /actively exploited|remote code execution|authentication bypass|zero.?day|critical/.test(
      text,
    )
  ) {
    return 20;
  }

  if (/credential|privilege escalation|command injection|data exposure/.test(text)) {
    return 17;
  }

  if (/vulnerab|denial of service|security bypass|malware/.test(text)) {
    return 14;
  }

  return 8;
}

function scoreFreshness(candidate: SourceCandidate, now: Date): number {
  const published = Date.parse(candidate.publishedAt);

  if (!Number.isFinite(published)) {
    return 3;
  }

  const ageHours = Math.max(0, now.getTime() - published) / 3_600_000;

  if (ageHours <= 48) return 15;
  if (ageHours <= 7 * 24) return 12;
  if (ageHours <= 30 * 24) return 8;
  return 2;
}

function scoreSourceAuthority(candidate: SourceCandidate): number {
  switch (candidate.sourceKind) {
    case "cert-in":
      return 15;
    case "nvd":
      return 14;
    case "github-advisory":
      return 14;
  }
}

function scoreNovelty(similarity: number): number {
  if (similarity < 0.25) return 15;
  if (similarity < 0.5) return 12;
  if (similarity < 0.7) return 8;
  return 3;
}

function scoreInsightPotential(candidate: SourceCandidate): number {
  const text = combinedText(candidate);

  if (/required action|apply.*update|mitigation|remediation|upgrade|patch/.test(text)) {
    return 15;
  }

  if (/impact assessment|risk assessment|actively exploited|workaround/.test(text)) {
    return 13;
  }

  if (/vulnerab|security|reliability|failure/.test(text)) {
    return 10;
  }

  return 6;
}

function normalizePublishedAt(value: string): string | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function evaluateEditorialPolicy(
  candidate: SourceCandidate,
  context: EditorialContext,
): EditorialScore {
  const now = context.now ?? new Date();
  const personaRelevance = scorePersonaRelevance(candidate, context.personaDomain);
  const practicalImpact = scorePracticalImpact(candidate);
  const freshness = scoreFreshness(candidate, now);
  const sourceAuthority = scoreSourceAuthority(candidate);
  const novelty = scoreNovelty(context.similarityToPublished);
  const insightPotential = scoreInsightPotential(candidate);
  const text = combinedText(candidate);

  const speculation = /rumou?r|unconfirmed|reportedly|might possibly/.test(text)
    ? 12
    : 0;
  const hypeWithoutConsequence =
    /revolutionary|game.?changing|breakthrough/.test(text) && practicalImpact <= 8
      ? 12
      : 0;

  const decision = decideCandidate(
    {
      id: candidate.sourceId,
      title: candidate.title,
      summary: candidate.summary,
      canonicalUrl: candidate.url,
      sourceUrls: [candidate.url],
      publishedAt: normalizePublishedAt(candidate.publishedAt),
      isAiOrTechnology: personaRelevance > 5,
      sourceReachable: true,
      evidenceSupported: candidate.summary.trim().length >= 30,
      promptInjectionDetected: context.promptInjectionDetected ?? false,
      similarityToPublished: context.similarityToPublished,
      scores: {
        personaRelevance,
        practicalImpact,
        freshness,
        sourceAuthority,
        novelty,
        insightPotential,
      },
      penalties: {
        speculation,
        nearDuplicate: 0,
        inaccessibleSource: 0,
        hypeWithoutConsequence,
      },
    },
    now,
  );

  const rationale = [
    decision.reason,
    `Persona relevance ${personaRelevance}/20; practical impact ${practicalImpact}/20; freshness ${freshness}/15.`,
    `Source authority ${sourceAuthority}/15; novelty ${novelty}/15; insight potential ${insightPotential}/15.`,
  ];

  return {
    personaRelevance,
    practicalImpact,
    freshness,
    sourceAuthority,
    novelty,
    insightPotential,
    baseScore: decision.baseScore,
    penaltyTotal: decision.penaltyTotal,
    total: decision.finalScore,
    maxScore: 100,
    threshold: PUBLISH_THRESHOLD,
    accepted: decision.verdict === "publish",
    hardRejections: decision.hardRejections,
    rationale,
  };
}

export function rejectedByHardGate(
  code: HardRejectionCode,
  reasons: string[],
): EditorialScore {
  return {
    personaRelevance: 0,
    practicalImpact: 0,
    freshness: 0,
    sourceAuthority: 0,
    novelty: 0,
    insightPotential: 0,
    baseScore: 0,
    penaltyTotal: 0,
    total: 0,
    maxScore: 100,
    threshold: PUBLISH_THRESHOLD,
    accepted: false,
    hardRejections: [code],
    rationale: reasons,
  };
}

export function judgeCandidate(
  candidate: SourceCandidate,
  context: EditorialContext,
): EditorialDecision {
  return {
    candidate,
    score: evaluateEditorialPolicy(candidate, context),
  };
}

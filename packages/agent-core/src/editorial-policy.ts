import {
  EditorialCandidateSchema,
  EditorialDecisionSchema,
  type EditorialCandidate,
  type EditorialDecision,
  type EditorialScores,
  type HardRejectionCode,
} from "@faultline/contracts";

export const PUBLISH_THRESHOLD = 72;
export const NEAR_DUPLICATE_THRESHOLD = 0.86;

export const EDITORIAL_WEIGHTS = Object.freeze({
  personaRelevance: 20,
  practicalImpact: 20,
  freshness: 15,
  sourceAuthority: 15,
  novelty: 15,
  insightPotential: 15,
} satisfies Record<keyof EditorialScores, number>);

const HARD_REJECTION_LABELS: Record<HardRejectionCode, string> = {
  off_domain: "topic is outside the AI/technology persona domain",
  source_unreachable: "no required source is reachable",
  unsupported_claim: "the available evidence does not support the claim",
  unsafe_source_content: "source content triggered the untrusted-content gate",
  near_duplicate: "the underlying topic is too similar to an existing post",
};

function collectHardRejections(
  candidate: EditorialCandidate,
): HardRejectionCode[] {
  const rejections: HardRejectionCode[] = [];

  if (!candidate.isAiOrTechnology) rejections.push("off_domain");
  if (!candidate.sourceReachable) rejections.push("source_unreachable");
  if (!candidate.evidenceSupported) rejections.push("unsupported_claim");
  if (candidate.promptInjectionDetected) {
    rejections.push("unsafe_source_content");
  }
  if (candidate.similarityToPublished >= NEAR_DUPLICATE_THRESHOLD) {
    rejections.push("near_duplicate");
  }

  return rejections;
}

function sumScores(scores: EditorialScores): number {
  return Object.values(scores).reduce((total, score) => total + score, 0);
}

function formatReason(
  hardRejections: HardRejectionCode[],
  finalScore: number,
): string {
  if (hardRejections.length > 0) {
    const details = hardRejections.map((code) => HARD_REJECTION_LABELS[code]);
    return `Rejected by hard gate: ${details.join("; ")}.`;
  }

  if (finalScore < PUBLISH_THRESHOLD) {
    return `Rejected at ${finalScore}/100: below the ${PUBLISH_THRESHOLD}-point publishing threshold.`;
  }

  return `Selected at ${finalScore}/100: the topic passed every hard gate and met the publishing threshold.`;
}

export function decideCandidate(
  rawCandidate: EditorialCandidate,
  decidedAt = new Date(),
): EditorialDecision {
  const candidate = EditorialCandidateSchema.parse(rawCandidate);
  const hardRejections = collectHardRejections(candidate);
  const baseScore = sumScores(candidate.scores);
  const penaltyTotal = Object.values(candidate.penalties).reduce(
    (total, penalty) => total + penalty,
    0,
  );
  const finalScore = Math.max(0, baseScore - penaltyTotal);
  const verdict =
    hardRejections.length === 0 && finalScore >= PUBLISH_THRESHOLD
      ? "publish"
      : "reject";

  return EditorialDecisionSchema.parse({
    candidateId: candidate.id,
    verdict,
    baseScore,
    penaltyTotal,
    finalScore,
    hardRejections,
    reason: formatReason(hardRejections, finalScore),
    decidedAt: decidedAt.toISOString(),
  });
}

import { describe, expect, it } from "vitest";

import type { EditorialCandidate } from "@faultline/contracts";

import {
  EDITORIAL_WEIGHTS,
  PUBLISH_THRESHOLD,
  decideCandidate,
} from "./editorial-policy.js";

const strongCandidate: EditorialCandidate = {
  id: "candidate-1",
  title: "A material AI reliability release",
  summary: "A primary source documents a production reliability change.",
  canonicalUrl: "https://example.com/reliability-release",
  sourceUrls: ["https://example.com/reliability-release"],
  publishedAt: "2026-08-08T10:00:00Z",
  isAiOrTechnology: true,
  sourceReachable: true,
  evidenceSupported: true,
  promptInjectionDetected: false,
  similarityToPublished: 0.2,
  scores: {
    personaRelevance: 18,
    practicalImpact: 18,
    freshness: 13,
    sourceAuthority: 14,
    novelty: 12,
    insightPotential: 12,
  },
  penalties: {
    speculation: 0,
    nearDuplicate: 0,
    inaccessibleSource: 0,
    hypeWithoutConsequence: 0,
  },
};

describe("editorial policy", () => {
  it("defines a rubric with a 100-point maximum", () => {
    const total = Object.values(EDITORIAL_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    expect(total).toBe(100);
    expect(PUBLISH_THRESHOLD).toBe(72);
  });

  it("publishes a strong candidate that passes every gate", () => {
    const decision = decideCandidate(
      strongCandidate,
      new Date("2026-08-08T12:00:00Z"),
    );

    expect(decision.verdict).toBe("publish");
    expect(decision.baseScore).toBe(87);
    expect(decision.hardRejections).toEqual([]);
  });

  it("hard-rejects an off-domain candidate regardless of score", () => {
    const decision = decideCandidate({
      ...strongCandidate,
      id: "candidate-off-domain",
      isAiOrTechnology: false,
    });

    expect(decision.verdict).toBe("reject");
    expect(decision.hardRejections).toContain("off_domain");
  });

  it("hard-rejects a near duplicate at the similarity boundary", () => {
    const decision = decideCandidate({
      ...strongCandidate,
      id: "candidate-duplicate",
      similarityToPublished: 0.86,
    });

    expect(decision.verdict).toBe("reject");
    expect(decision.hardRejections).toContain("near_duplicate");
  });

  it("rejects an eligible candidate below the score threshold", () => {
    const decision = decideCandidate({
      ...strongCandidate,
      id: "candidate-low-score",
      scores: {
        personaRelevance: 12,
        practicalImpact: 11,
        freshness: 8,
        sourceAuthority: 10,
        novelty: 8,
        insightPotential: 7,
      },
    });

    expect(decision.finalScore).toBe(56);
    expect(decision.verdict).toBe("reject");
    expect(decision.hardRejections).toEqual([]);
  });

  it("applies penalties before the publish decision", () => {
    const decision = decideCandidate({
      ...strongCandidate,
      id: "candidate-hype-penalty",
      penalties: {
        speculation: 8,
        nearDuplicate: 0,
        inaccessibleSource: 0,
        hypeWithoutConsequence: 10,
      },
    });

    expect(decision.baseScore).toBe(87);
    expect(decision.penaltyTotal).toBe(18);
    expect(decision.finalScore).toBe(69);
    expect(decision.verdict).toBe("reject");
  });
});

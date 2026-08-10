import { describe, expect, it } from "vitest";

import type { AgentRecord } from "../db.js";
import type { SourceCandidate } from "../sources/types.js";
import type { EditorialScore } from "./judge.js";
import {
  generateEditorialPost,
  normalizePublishedPostText,
  normalizeSourceProse,
  wordSafeLimit,
} from "./generator.js";

const agent = {
  agentId: "agent-mira",
  personaName: "Mira",
  personaDomain: "AI Reliability & Security",
  initializedAt: "2026-08-09T10:00:00.000Z",
  nextRunAt: "2026-08-09T11:00:00.000Z",
  lastRunAt: null,
  workerState: "idle",
  workerHeartbeatAt: null,
  lockToken: null,
  lockedUntil: null,
} satisfies AgentRecord;

const score = {
  personaRelevance: 20,
  practicalImpact: 20,
  freshness: 15,
  sourceAuthority: 14,
  novelty: 15,
  insightPotential: 15,
  baseScore: 99,
  penaltyTotal: 0,
  total: 99,
  maxScore: 100,
  threshold: 72,
  accepted: true,
  hardRejections: [],
  rationale: [],
} satisfies EditorialScore;

function candidate(): SourceCandidate {
  return {
    sourceId: "GHSA-test",
    sourceKind: "github-advisory",
    title: "Command injection in a developer tool",
    summary:
      "### Summary The tool displayed **attacker-controlled shell commands** as trusted guidance. " +
      "Builders following that recommendation could execute untrusted code. ".repeat(12),
    url: "https://github.com/advisories/GHSA-test",
    publishedAt: "2026-08-09T10:00:00.000Z",
    sourceName: "GitHub Security Advisories",
    tags: ["security", "command injection"],
  };
}

describe("editorial prose generation", () => {
  it("removes source markdown before it can reach the public feed", () => {
    expect(normalizeSourceProse("### **Risk** `npm run bad` [source](https://x.test)"))
      .toBe("Risk npm run bad source");
  });

  it("truncates on a sentence or word boundary", () => {
    const excerpt = wordSafeLimit(
      "This opening sentence carries enough useful context to stand alone. " +
        "boundary ".repeat(30),
      90,
    );
    expect(excerpt).toBe(
      "This opening sentence carries enough useful context to stand alone.…",
    );
    expect(excerpt).not.toMatch(/bounda…$/);
  });

  it("cleans legacy stored posts at the public feed boundary", () => {
    const legacy = [
      `Signal — ### Summary **Untrusted command** \`npm run unsafe\` ${"detail ".repeat(100)}`,
      "Fault line — A missed trust boundary becomes a control-plane problem.",
      "Builder move — Patch the exposed path and verify the mitigation.",
    ].join("\n\n");
    const normalized = normalizePublishedPostText(legacy);

    expect(normalized).not.toMatch(/###|\*\*|`/);
    expect(normalized).toContain("Signal — Summary Untrusted command npm run unsafe");
    expect(normalized).toContain("\n\nFault line —");
    expect(normalized).toContain("\n\nBuilder move —");
    expect(normalized.split("\n\n")[0]).not.toMatch(/detai…$/);
  });

  it("publishes clean, compact prose with transparent selection context", () => {
    const post = generateEditorialPost(
      agent,
      candidate(),
      score,
      { candidatesConsidered: 24, candidatesRejected: 23, runnerUpScore: 93 },
      new Date("2026-08-09T10:30:00.000Z"),
    );

    expect(post.text).not.toMatch(/###|\*\*|`/);
    expect(post.text).toContain("Signal —");
    expect(post.text).toContain("Fault line —");
    expect(post.text).toContain("Builder move —");
    expect(post.rationale).toContain("ranked it first at 99/100");
    expect(post.rationale).toContain("23 alternatives stayed out of the feed");
  });
});

import {
  judgeCandidate,
} from "./judge.js";

import type {
  SourceCandidate,
} from "../sources/types.js";

const strongCandidate: SourceCandidate = {
  sourceId: "CVE-2026-TEST-001",
  sourceKind: "cisa-kev",

  title:
    "Actively Exploited Remote Code Execution Vulnerability",

  summary:
    "A critical vulnerability is being actively exploited and requires immediate patching and remediation.",

  url:
    "https://www.cisa.gov/known-exploited-vulnerabilities",

  publishedAt:
    new Date().toISOString(),

  sourceName:
    "CISA Known Exploited Vulnerabilities",

  tags: [
    "cybersecurity",
    "vulnerability",
    "exploited",
  ],

  rawContent:
    "Known exploited vulnerability requiring immediate patch and mitigation.",
};

const weakCandidate: SourceCandidate = {
  sourceId: "TEST-WEAK-001",
  sourceKind: "nvd",

  title: "Minor issue",

  summary:
    "A vulnerability was recorded.",

  url:
    "https://nvd.nist.gov/",

  publishedAt:
    new Date().toISOString(),

  sourceName:
    "National Vulnerability Database",

  tags: [
    "vulnerability",
  ],
};

for (
  const candidate of [
    strongCandidate,
    weakCandidate,
  ]
) {
  const decision =
    judgeCandidate(candidate);

  console.log("\n======================");

  console.log(
    "Candidate:",
    candidate.title,
  );

  console.log(
    "Source credibility:",
    `${decision.score.sourceCredibility}/15`,
  );

  console.log(
    "Impact:",
    `${decision.score.impact}/15`,
  );

  console.log(
    "Novelty:",
    `${decision.score.novelty}/12`,
  );

  console.log(
    "India relevance:",
    `${decision.score.indiaRelevance}/12`,
  );

  console.log(
    "Actionability:",
    `${decision.score.actionability}/10`,
  );

  console.log(
    "Clarity:",
    `${decision.score.clarity}/8`,
  );

  console.log(
    "TOTAL:",
    `${decision.score.total}/72`,
  );

  console.log(
    "THRESHOLD:",
    `${decision.score.threshold}/72`,
  );

  console.log(
    "DECISION:",
    decision.score.accepted
      ? "ACCEPT"
      : "REJECT",
  );

  console.log(
    "RATIONALE:",
    decision.score.rationale,
  );
}
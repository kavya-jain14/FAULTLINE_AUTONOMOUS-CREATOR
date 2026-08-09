import {
  judgeCandidate,
} from "./judge.js";

import {
  generateMiraPost,
} from "./generator.js";

import type {
  SourceCandidate,
} from "../sources/types.js";

const candidate: SourceCandidate = {
  sourceId:
    "CVE-2026-8037",

  sourceKind:
    "cisa-kev",

  title:
    "Progress LoadMaster Command Injection Vulnerability",

  summary:
    "A vulnerability affecting Progress LoadMaster has been added to the CISA Known Exploited Vulnerabilities catalog, indicating active exploitation and the need for timely remediation.",

  url:
    "https://www.cisa.gov/known-exploited-vulnerabilities",

  publishedAt:
    "2026-08-07",

  sourceName:
    "CISA Known Exploited Vulnerabilities",

  tags: [
    "cybersecurity",
    "vulnerability",
    "exploited",
  ],

  rawContent:
    "Known exploited vulnerability requiring remediation.",
};

const decision =
  judgeCandidate(candidate);

console.log(
  "Editorial decision:",
  decision.score.accepted
    ? "ACCEPT"
    : "REJECT",
);

console.log(
  "Score:",
  `${decision.score.total}/72`,
);

if (!decision.score.accepted) {
  console.log(
    "Candidate was rejected. No post generated.",
  );

  process.exit(0);
}

const post =
  generateMiraPost(
    candidate,
    decision.score,
  );

console.log(
  "\n========== MIRA POST ==========\n",
);

console.log(
  "HEADLINE:",
  post.headline,
);

console.log(
  "\nBODY:\n",
  post.body,
);

console.log(
  "\nRATIONALE:\n",
  post.rationale,
);

console.log(
  "\nSOURCE IDS:",
  post.sourceIds,
);

console.log(
  "\nSOURCE URLS:",
  post.sourceUrls,
);

console.log(
  "\nGENERATED AT:",
  post.generatedAt,
);
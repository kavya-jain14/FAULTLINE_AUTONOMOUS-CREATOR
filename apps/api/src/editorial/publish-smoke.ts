import {
  createAgent,
  getPosts,
} from "../db.js";

import {
  publishCandidate,
} from "./publish.js";

import type {
  SourceCandidate,
} from "../sources/types.js";

const agentId =
  "faultline-publish-smoke";

try {
  createAgent({
    agentId,
    personaName: "Mira",
    personaDomain:
      "AI Reliability & Security",
    initializedAt:
      new Date().toISOString(),
    nextRunAt:
      new Date(
        Date.now() + 60_000,
      ).toISOString(),
  });
} catch {
  // Agent may already exist.
}

const candidate: SourceCandidate = {
  sourceId:
    "SMOKE-CVE-2026-001",

  sourceKind:
    "cisa-kev",

  title:
    "Actively Exploited Remote Code Execution Vulnerability",

  summary:
    "A security vulnerability is being actively exploited and requires timely remediation by affected organizations.",

  url:
    "https://www.cisa.gov/known-exploited-vulnerabilities",

  publishedAt:
    "2026-08-09",

  sourceName:
    "CISA Known Exploited Vulnerabilities",

  tags: [
    "cybersecurity",
    "vulnerability",
    "exploitation",
  ],

  rawContent:
    "Authoritative security advisory describing an actively exploited vulnerability.",
};

console.log(
  "\n========== PUBLISH SMOKE ==========\n",
);

const result =
  publishCandidate(
    agentId,
    candidate,
  );

console.log(
  "Published:",
  result.published,
);

console.log(
  "Decision:",
  result.decision.score.accepted
    ? "ACCEPT"
    : "REJECT",
);

if (result.published && result.post) {
  console.log(
    "\nPOST ID:",
    result.post.id,
  );

  console.log(
    "\nPOST TEXT:\n",
    result.post.text,
  );

  console.log(
    "\nRATIONALE:\n",
    result.post.rationale,
  );

  console.log(
    "\nSOURCES:\n",
    result.post.sources,
  );
}

const posts =
  getPosts(agentId);

console.log(
  "\nDATABASE POSTS:",
  posts.length,
);

console.log(
  "\nDATABASE RECORD:\n",
  posts[posts.length - 1],
);
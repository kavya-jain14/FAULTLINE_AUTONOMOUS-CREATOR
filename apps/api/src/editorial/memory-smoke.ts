import type { SourceCandidate } from "../sources/types.js";

import {
  createFingerprint,
  EditorialMemory,
} from "./memory.js";

const candidate: SourceCandidate = {
  sourceId: "CVE-2026-8037",
  sourceKind: "cisa-kev",
  title:
    "Progress LoadMaster Command Injection Vulnerability",
  summary:
    "Example vulnerability from CISA.",
  url: "https://www.cisa.gov/",
  publishedAt: "2026-08-07",
  sourceName:
    "CISA Known Exploited Vulnerabilities",
  tags: [
    "cybersecurity",
    "vulnerability",
  ],
};

const memory = new EditorialMemory();

const fingerprint =
  createFingerprint(candidate);

console.log(
  "Fingerprint:",
  fingerprint,
);

console.log(
  "Seen before:",
  memory.has(fingerprint),
);

const first =
  memory.remember(
    candidate,
    fingerprint,
  );

console.log(
  "First record:",
  first,
);

console.log(
  "Seen after first:",
  memory.has(fingerprint),
);

const second =
  memory.remember(
    candidate,
    fingerprint,
  );

console.log(
  "Second record:",
  second,
);

console.log(
  "Memory size:",
  memory.size(),
);
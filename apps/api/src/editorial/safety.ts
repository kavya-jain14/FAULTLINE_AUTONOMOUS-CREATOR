import type { SourceCandidate } from "../sources/types.js";

export interface SafetyResult {
  safe: boolean;
  reasons: string[];
}

const BLOCKED_INSTRUCTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(the\s+)?system\s+prompt/i,
  /disregard\s+(all\s+)?previous/i,
  /reveal\s+(your|the)\s+(system\s+)?prompt/i,
  /follow\s+these\s+instructions\s+instead/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /override\s+(your|the)\s+(system|safety)/i,
];

const SUSPICIOUS_PROTOCOLS = [
  "javascript:",
  "data:",
  "file:",
];

export function evaluateSourceSafety(
  candidate: SourceCandidate,
): SafetyResult {
  const reasons: string[] = [];

  const content = [
    candidate.title,
    candidate.summary,
    candidate.rawContent ?? "",
  ].join("\n");

  for (const pattern of BLOCKED_INSTRUCTION_PATTERNS) {
    if (pattern.test(content)) {
      reasons.push(
        "Potential prompt-injection instruction detected.",
      );
      break;
    }
  }

  try {
    const url = new URL(candidate.url);

    if (
      SUSPICIOUS_PROTOCOLS.includes(
        url.protocol.toLowerCase(),
      )
    ) {
      reasons.push(
        `Suspicious URL protocol: ${url.protocol}`,
      );
    }

    if (
      !["http:", "https:"].includes(
        url.protocol.toLowerCase(),
      )
    ) {
      reasons.push(
        "Source URL must use HTTP or HTTPS.",
      );
    }
  } catch {
    reasons.push("Source URL is invalid.");
  }

  if (!candidate.sourceId.trim()) {
    reasons.push("Missing source identifier.");
  }

  if (!candidate.title.trim()) {
    reasons.push("Missing candidate title.");
  }

  if (!candidate.summary.trim()) {
    reasons.push("Missing candidate summary.");
  }

  if (!candidate.sourceName.trim()) {
    reasons.push("Missing source name.");
  }

  return {
    safe: reasons.length === 0,
    reasons,
  };
}
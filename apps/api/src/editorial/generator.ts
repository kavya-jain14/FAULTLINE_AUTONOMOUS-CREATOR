import type { AgentRecord } from "../db.js";
import type { SourceCandidate } from "../sources/types.js";
import type { EditorialScore } from "./judge.js";

export interface GeneratedPost {
  text: string;
  rationale: string;
  sourceUrls: string[];
  generatedAt: string;
}

export interface SelectionContext {
  candidatesConsidered: number;
  candidatesRejected: number;
  runnerUpScore: number | null;
}

export function normalizeSourceProse(value: string): string {
  return value
    .replace(/```[a-z]*|```/gi, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordSafeLimit(value: string, maximum: number): string {
  const cleaned = normalizeSourceProse(value);

  if (cleaned.length <= maximum) {
    return cleaned;
  }

  const window = cleaned.slice(0, maximum);
  const sentenceBoundary = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("? "),
    window.lastIndexOf("! "),
  );
  const wordBoundary = window.lastIndexOf(" ");
  const cutAt =
    sentenceBoundary >= Math.round(maximum * 0.52)
      ? sentenceBoundary + 1
      : wordBoundary;

  return `${window.slice(0, Math.max(1, cutAt)).trimEnd()}…`;
}

export function normalizePublishedPostText(value: string): string {
  const cleaned = normalizeSourceProse(value);
  const sectionPattern =
    /(?:^|\s)(Signal|Fault line|Builder move)\s*[—–:-]\s*/gi;
  const matches = [...cleaned.matchAll(sectionPattern)];

  if (matches.length < 2) {
    return wordSafeLimit(cleaned, 1_200);
  }

  return matches
    .map((match, index) => {
      const label = match[1] ?? "Signal";
      const start = (match.index ?? 0) + match[0].length;
      const end = matches[index + 1]?.index ?? cleaned.length;
      const maximum = label.toLowerCase() === "signal" ? 520 : 720;
      return `${label} — ${wordSafeLimit(cleaned.slice(start, end), maximum)}`;
    })
    .join("\n\n");
}

function faultLine(candidate: SourceCandidate): string {
  const text = `${candidate.title} ${candidate.summary} ${candidate.rawContent ?? ""}`.toLowerCase();

  if (/actively exploited|known exploited|zero.?day/.test(text)) {
    return "The exploitation window is already open; inventory lag now matters more than headline severity.";
  }

  if (/remote code execution|command injection/.test(text)) {
    return "Remote execution turns a missed exposure check into a control-plane problem, especially where internet-facing assets are not mapped.";
  }

  if (/authentication bypass|credential|password/.test(text)) {
    return "Identity controls cannot compensate for a bypassed trust boundary; exposed sessions and credentials need separate containment.";
  }

  if (/denial of service/.test(text)) {
    return "Availability failures become reliability incidents when capacity and failover assumptions have never been exercised under attack.";
  }

  return "The source establishes the signal, but the operational risk depends on whether affected assets, versions, and trust boundaries are actually known.";
}

function builderMove(candidate: SourceCandidate): string {
  const text = `${candidate.summary} ${candidate.rawContent ?? ""}`.toLowerCase();

  if (/apply.*update|upgrade|patch|vendor update/.test(text)) {
    return "Map the affected versions in your inventory, test the vendor update on a representative path, then patch exposed systems first and record the exception set.";
  }

  if (/mitigation|workaround|required action/.test(text)) {
    return "Translate the source mitigation into one owned change, verify it against an exposed asset, and monitor the same failure path after rollout.";
  }

  return "Validate whether the affected component exists in your stack, reproduce the failure condition safely, and assign an explicit patch or mitigation owner.";
}

function relevantNow(candidate: SourceCandidate, score: EditorialScore): string {
  const published = Date.parse(candidate.publishedAt);
  const date = Number.isFinite(published)
    ? new Date(published).toISOString().slice(0, 10)
    : "the current discovery cycle";

  return `Relevant now because the primary source was published or updated on ${date} and received ${score.freshness}/15 for timeliness.`;
}

export function generateEditorialPost(
  agent: AgentRecord,
  candidate: SourceCandidate,
  score: EditorialScore,
  selection: SelectionContext,
  generatedAt = new Date(),
): GeneratedPost {
  const signal = wordSafeLimit(`${candidate.title}: ${candidate.summary}`, 520);
  const text = [
    `Signal — ${signal}`,
    `Fault line — ${faultLine(candidate)}`,
    `Builder move — ${builderMove(candidate)}`,
  ].join("\n\n");

  const competition =
    selection.runnerUpScore === null
      ? `It was the only candidate to clear the publication bar in this cycle.`
      : `The next qualified candidate scored ${selection.runnerUpScore}/100; ${selection.candidatesRejected} alternatives stayed out of the feed.`;

  const rationale = [
    `Selected because ${agent.personaName}'s ${agent.personaDomain} policy linked a primary-source change to a concrete builder action and ranked it first at ${score.total}/100.`,
    relevantNow(candidate, score),
    `Chosen over ${Math.max(0, selection.candidatesConsidered - 1)} alternatives. ${competition}`,
  ].join(" ");

  return {
    text,
    rationale,
    sourceUrls: [candidate.url],
    generatedAt: generatedAt.toISOString(),
  };
}

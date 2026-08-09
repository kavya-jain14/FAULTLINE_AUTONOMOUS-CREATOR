import {
  evaluateSourceSafety,
} from "./safety.js";

import {
  createFingerprint,
  EditorialMemory,
} from "./memory.js";

import {
  evaluateEditorialPolicy,
  type EditorialScore,
} from "./judge.js";

import type {
  SourceCandidate,
} from "../sources/types.js";

export type CandidateDecision =
  | "accepted"
  | "rejected"
  | "duplicate";

export interface ProcessedCandidate {
  candidate: SourceCandidate;

  decision: CandidateDecision;

  reasons: string[];

  fingerprint: string;

  editorialScore?: EditorialScore;
}

export interface PipelineResult {
  processed: ProcessedCandidate[];

  accepted: SourceCandidate[];

  rejected: ProcessedCandidate[];

  duplicates: ProcessedCandidate[];
}

export class EditorialPipeline {
  constructor(
    private readonly memory: EditorialMemory,
  ) {}

  process(
    candidates: SourceCandidate[],
  ): PipelineResult {
    const processed: ProcessedCandidate[] = [];

    for (const candidate of candidates) {
      const fingerprint =
        createFingerprint(candidate);

      /*
       * STEP 1
       * Duplicate detection
       */

      if (this.memory.has(fingerprint)) {
        this.memory.remember(
          candidate,
          fingerprint,
        );

        processed.push({
          candidate,

          decision: "duplicate",

          reasons: [
            "Candidate already exists in editorial memory.",
          ],

          fingerprint,
        });

        continue;
      }

      /*
       * STEP 2
       * Source safety / prompt injection protection
       */

      const safety =
        evaluateSourceSafety(candidate);

      if (!safety.safe) {
        this.memory.remember(
          candidate,
          fingerprint,
        );

        processed.push({
          candidate,

          decision: "rejected",

          reasons:
            safety.reasons,

          fingerprint,
        });

        continue;
      }

      /*
       * STEP 3
       * 72-point editorial policy
       */

      const editorialScore =
        evaluateEditorialPolicy(
          candidate,
        );

      this.memory.remember(
        candidate,
        fingerprint,
      );

      /*
       * STEP 4
       * Final editorial decision
       */

      if (!editorialScore.accepted) {
        processed.push({
          candidate,

          decision: "rejected",

          reasons:
            editorialScore.rationale,

          fingerprint,

          editorialScore,
        });

        continue;
      }

      processed.push({
        candidate,

        decision: "accepted",

        reasons:
          editorialScore.rationale,

        fingerprint,

        editorialScore,
      });
    }

    return {
      processed,

      accepted: processed
        .filter(
          (item) =>
            item.decision ===
            "accepted",
        )
        .map(
          (item) =>
            item.candidate,
        ),

      rejected: processed.filter(
        (item) =>
          item.decision ===
          "rejected",
      ),

      duplicates: processed.filter(
        (item) =>
          item.decision ===
          "duplicate",
      ),
    };
  }
}
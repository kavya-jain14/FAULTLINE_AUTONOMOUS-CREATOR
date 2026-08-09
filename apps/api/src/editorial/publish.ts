import { randomUUID } from "node:crypto";

import {
  createPost,
  getAgent,
} from "../db.js";

import {
  generateMiraPost,
} from "./generator.js";

import {
  judgeCandidate,
} from "./judge.js";

import type {
  SourceCandidate,
} from "../sources/types.js";

export function publishCandidate(
  agentId: string,
  candidate: SourceCandidate,
) {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(
      `Agent ${agentId} does not exist.`,
    );
  }

  const decision =
    judgeCandidate(candidate);

  if (!decision.score.accepted) {
    return {
      published: false,
      decision,
    };
  }

  const generated =
    generateMiraPost(
      candidate,
      decision.score,
    );

  const post =
    createPost({
      id: randomUUID(),
      agentId,
      createdAt:
        generated.generatedAt,
      text:
        `${generated.headline}\n\n${generated.body}`,
      rationale:
        generated.rationale.join("\n"),
      sources:
        generated.sourceUrls,
    });

  return {
    published: true,
    decision,
    post,
  };
}
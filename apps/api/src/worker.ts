import { randomUUID } from "node:crypto";

import {
  createDecision,
  createRun,
  completeRun,
  getAgent,
  updateAgentWorkerState,
} from "./db.js";

import { SourceRegistry } from "./sources/index.js";

import {
  EditorialPipeline,
} from "./editorial/pipeline.js";

import {
  EditorialMemory,
} from "./editorial/memory.js";

import {
  publishCandidate,
} from "./editorial/publish.js";

export interface WorkerRunResult {
  runId: string;
  discovered: number;
  rejected: number;
  duplicates: number;
  published: number;
  degraded: boolean;
}

const DEFAULT_INTERVAL_MS = 60_000;

export async function runAgentOnce(
  agentId: string,
  options: {
    sourceRegistry?: SourceRegistry;
    memory?: EditorialMemory;
  } = {},
): Promise<WorkerRunResult> {
  const agent = getAgent(agentId);

  if (!agent) {
    throw new Error(
      `Agent ${agentId} does not exist.`,
    );
  }

  const runId = randomUUID();
  const startedAt =
    new Date().toISOString();

  createRun({
    id: runId,
    agentId,
    startedAt,
  });

  const memory =
    options.memory ?? new EditorialMemory();

  const registry =
    options.sourceRegistry ??
    new SourceRegistry();

  const pipeline =
    new EditorialPipeline(memory);

  let discovered = 0;
  let rejected = 0;
  let duplicates = 0;
  let published = 0;

  try {
    updateAgentWorkerState(
      agentId,
      {
        workerState: "discovering",
      },
    );

    const sourceResults =
      await registry.fetchAll();

    const candidates =
      sourceResults.flatMap(
        (result) => result.candidates,
      );

    discovered = candidates.length;

    const sourceErrors =
      sourceResults
        .filter(
          (result) =>
            result.error !== null,
        )
        .map(
          (result) =>
            `${result.source}: ${result.error}`,
        );

    updateAgentWorkerState(
      agentId,
      {
        workerState: "judging",
      },
    );

    const pipelineResult =
      pipeline.process(candidates);

    rejected =
      pipelineResult.rejected.length;

    duplicates =
      pipelineResult.duplicates.length;

    for (const item of pipelineResult.processed) {
      if (!item.editorialScore) {
        continue;
      }

      createDecision({
        id: randomUUID(),
        agentId,
        title: item.candidate.title,
        finalScore:
          item.editorialScore.total,
        reason:
          item.reasons.join("\n"),
        sourceUrl:
          item.candidate.url,
        decidedAt:
          new Date().toISOString(),
      });
    }

    updateAgentWorkerState(
      agentId,
      {
        workerState: "publishing",
      },
    );

    for (
      const candidate of
      pipelineResult.accepted
    ) {
      const result =
        publishCandidate(
          agentId,
          candidate,
        );

      if (result.published) {
        published += 1;
      }
    }

    const completedAt =
      new Date().toISOString();

    const degraded =
      sourceErrors.length > 0;

    const summary = [
      `Discovered: ${discovered}.`,
      `Rejected: ${rejected}.`,
      `Duplicates: ${duplicates}.`,
      `Published: ${published}.`,
      ...(sourceErrors.length > 0
        ? [
            `Source errors: ${sourceErrors.join(
              " | ",
            )}`,
          ]
        : []),
    ].join(" ");

    completeRun({
      id: runId,
      completedAt,
      status:
        degraded
          ? "degraded"
          : "completed",
      discovered,
      rejected,
      published,
      summary,
    });

    const nextRunAt =
      new Date(
        Date.now() +
          DEFAULT_INTERVAL_MS,
      ).toISOString();

    updateAgentWorkerState(
      agentId,
      {
        workerState:
          degraded
            ? "degraded"
            : "idle",
        lastRunAt:
          completedAt,
        nextRunAt,
      },
    );

    return {
      runId,
      discovered,
      rejected,
      duplicates,
      published,
      degraded,
    };
  } catch (error) {
    const completedAt =
      new Date().toISOString();

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    completeRun({
      id: runId,
      completedAt,
      status: "failed",
      discovered,
      rejected,
      published,
      summary:
        `Worker failed: ${message}`,
    });

    updateAgentWorkerState(
      agentId,
      {
        workerState: "degraded",
        lastRunAt:
          completedAt,
      },
    );

    throw error;
  }
}
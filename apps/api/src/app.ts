import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import {
  ControlRoomSnapshotSchema,
  FeedResponseSchema,
  InitializeAgentRequestSchema,
  InitializeAgentResponseSchema,
} from "@faultline/contracts";

import {
  countPosts,
  countRejected,
  createAgent,
  getAgent,
  getPosts,
} from "./db.js";

function sendJson(
  response: ServerResponse,
  status: number,
  payload: unknown,
): void {
  response.statusCode = status;
  response.setHeader(
    "Content-Type",
    "application/json; charset=utf-8",
  );
  response.end(JSON.stringify(payload));
}

function now(): string {
  return new Date().toISOString();
}

async function readBody(
  request: IncomingMessage,
): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function createAgentId(personaName: string): string {
  const slug = personaName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `faultline-${slug || "agent"}-${randomUUID().slice(0, 6)}`;
}

function buildControlRoom(agentId: string) {
  const agent = getAgent(agentId);

  if (!agent) {
    return null;
  }

  return ControlRoomSnapshotSchema.parse({
    agentId,

    autonomy: {
      initializedAt: agent.initializedAt,
      lastRunAt: agent.lastRunAt,
      nextRunAt: agent.nextRunAt,
      postsPublished: countPosts(agentId),
      candidatesRejected: countRejected(agentId),
      workerState: agent.workerState,
    },

    editorialLedger: [],

    runs: [],

    health: [
      {
        key: "api",
        label: "API",
        state: "healthy",
        detail: "API process is responding.",
        checkedAt: now(),
      },
      {
        key: "worker",
        label: "Autonomous worker",
        state: "unknown",
        detail: "Autonomous worker has not started yet.",
        checkedAt: now(),
      },
      {
        key: "database",
        label: "Database",
        state: "healthy",
        detail: "Durable SQLite database is available.",
        checkedAt: now(),
      },
      {
        key: "sources",
        label: "Primary sources",
        state: "unknown",
        detail: "Source adapters are not connected yet.",
        checkedAt: now(),
      },
    ],
  });
}

export async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "localhost"}`,
  );

  /*
   * Health endpoint
   */
  if (
    request.method === "GET" &&
    url.pathname === "/health"
  ) {
    sendJson(response, 200, {
      status: "ok",
      service: "faultline-api",
      checkedAt: now(),
    });

    return;
  }

  /*
   * POST /api/agent/init
   */
  if (
    request.method === "POST" &&
    url.pathname === "/api/agent/init"
  ) {
    let body: unknown;

    try {
      body = JSON.parse(await readBody(request));
    } catch {
      sendJson(response, 400, {
        message: "Request body must be valid JSON.",
      });

      return;
    }

    const parsed =
      InitializeAgentRequestSchema.safeParse(body);

    if (!parsed.success) {
      sendJson(response, 400, {
        message: "Invalid agent initialization payload.",
      });

      return;
    }

    const initializedAt = now();

    /*
     * Important:
     * This only schedules a future run.
     * It does NOT execute discovery or publishing.
     */
    const nextRunAt = new Date(
      Date.now() + 60_000,
    ).toISOString();

    const agentId = createAgentId(
      parsed.data.persona.name,
    );

    createAgent({
      agentId,
      personaName: parsed.data.persona.name,
      personaDomain: parsed.data.persona.domain,
      initializedAt,
      nextRunAt,
    });

    const payload =
      InitializeAgentResponseSchema.parse({
        agentId,
      });

    sendJson(response, 201, payload);

    return;
  }

  /*
   * GET /api/agent/feed
   *
   * READ ONLY.
   *
   * This endpoint never:
   * - discovers sources
   * - calls an LLM
   * - judges candidates
   * - publishes
   * - starts a worker
   */
  if (
    request.method === "GET" &&
    url.pathname === "/api/agent/feed"
  ) {
    const agentId = url.searchParams.get("agentId");

    if (!agentId) {
      sendJson(response, 400, {
        message: "agentId is required.",
      });

      return;
    }

    if (!getAgent(agentId)) {
      sendJson(response, 404, {
        message: "Agent not found.",
      });

      return;
    }

    const posts = getPosts(agentId);

    const payload = FeedResponseSchema.parse({
      posts: posts.map((post) => ({
        id: post.id,
        createdAt: post.createdAt,
        text: post.text,
        rationale: post.rationale,
        sources: post.sources,
      })),
    });

    sendJson(response, 200, payload);

    return;
  }

  /*
   * GET /api/agent/control-room
   */
  if (
    request.method === "GET" &&
    url.pathname === "/api/agent/control-room"
  ) {
    const agentId = url.searchParams.get("agentId");

    if (!agentId) {
      sendJson(response, 400, {
        message: "agentId is required.",
      });

      return;
    }

    const snapshot = buildControlRoom(agentId);

    if (!snapshot) {
      sendJson(response, 404, {
        message: "Agent not found.",
      });

      return;
    }

    sendJson(response, 200, snapshot);

    return;
  }
    /*
   * POST /api/agent/run
   *
   * Triggers one autonomous discovery/editorial/publishing run.
   */
  if (
    request.method === "POST" &&
    url.pathname === "/api/agent/run"
  ) {
    const agentId = url.searchParams.get("agentId");

    if (!agentId) {
      sendJson(response, 400, {
        message: "agentId is required.",
      });

      return;
    }

    if (!getAgent(agentId)) {
      sendJson(response, 404, {
        message: "Agent not found.",
      });

      return;
    }

    try {
      const { runAgentOnce } =
        await import("./worker.js");

      const result =
        await runAgentOnce(agentId);

      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, {
        message:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    return;
  }
  sendJson(response, 404, {
    message: "Route not found.",
  });
}
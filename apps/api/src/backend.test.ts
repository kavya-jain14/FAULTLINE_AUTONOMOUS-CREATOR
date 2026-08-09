import { beforeAll, describe, expect, it } from "vitest";

import { SourceRegistry } from "./sources/index.js";
import type {
  SourceAdapter,
  SourceCandidate,
} from "./sources/types.js";

const databasePath = `/tmp/faultline-backend-test-${process.pid}-${Date.now()}.sqlite`;
process.env.FAULTLINE_DB_PATH = databasePath;

const NOW = new Date("2026-08-09T12:00:00.000Z");

function strongCandidate(): SourceCandidate {
  return {
    sourceId: "CIVN-2026-9999",
    sourceKind: "cert-in",
    title: "Critical remote code execution in model-serving gateway",
    summary:
      "CERT-In reports an actively exploited remote code execution vulnerability in an internet-facing model-serving gateway and recommends applying the vendor update immediately.",
    url: "https://www.cert-in.org.in/example/CIVN-2026-9999",
    publishedAt: "2026-08-09T10:00:00.000Z",
    sourceName: "CERT-In Advisories",
    tags: ["ai", "security", "actively exploited", "patch"],
    rawContent:
      "Risk Assessment: Critical. Required action: apply the vendor update and verify exposed systems.",
  };
}

function weakCandidate(): SourceCandidate {
  return {
    sourceId: "OFF-TOPIC-1",
    sourceKind: "cert-in",
    title: "Quarterly lifestyle update",
    summary:
      "A non-technical lifestyle announcement without a software, artificial intelligence, reliability, or security consequence.",
    url: "https://www.cert-in.org.in/example/OFF-TOPIC-1",
    publishedAt: "2026-08-09T10:00:00.000Z",
    sourceName: "CERT-In Advisories",
    tags: ["announcement"],
  };
}

class FixedAdapter implements SourceAdapter {
  readonly kind = "cert-in" as const;
  readonly name = "Deterministic primary source";

  constructor(
    private readonly candidates: SourceCandidate[],
    private readonly delayMs = 0,
  ) {}

  async fetchCandidates(): Promise<SourceCandidate[]> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    return this.candidates;
  }
}

let dbModule: typeof import("./db.js");
let workerModule: typeof import("./worker.js");
let schedulerModule: typeof import("./scheduler.js");
let appModule: typeof import("./app.js");

beforeAll(async () => {
  dbModule = await import("./db.js");
  workerModule = await import("./worker.js");
  schedulerModule = await import("./scheduler.js");
  appModule = await import("./app.js");
});

describe("durable autonomous runtime", () => {
  it("publishes one paced, evaluator-compatible post and persists real telemetry", async () => {
    const agentId = "agent-first-cycle";
    dbModule.createAgent({
      agentId,
      personaName: "Mira",
      personaDomain: "AI Reliability & Security",
      initializedAt: NOW.toISOString(),
      nextRunAt: NOW.toISOString(),
    });
    const registry = new SourceRegistry(
      [new FixedAdapter([strongCandidate(), weakCandidate()])],
      { retries: 0, timeoutMs: 1_000 },
    );

    const result = await workerModule.runAgentOnce(agentId, {
      sourceRegistry: registry,
      clock: () => NOW,
      runtime: { scheduleJitterMs: 0 },
    });

    expect(result).toMatchObject({
      skipped: false,
      discovered: 2,
      rejected: 1,
      duplicates: 0,
      published: 1,
    });

    const posts = dbModule.getPosts(agentId);
    expect(posts).toHaveLength(1);
    expect(posts[0]?.text).toContain("Signal —");
    expect(posts[0]?.text).toContain("Fault line —");
    expect(posts[0]?.text).toContain("Builder move —");
    expect(posts[0]?.rationale).toContain("Selected because");
    expect(posts[0]?.rationale).toContain("Relevant now because");
    expect(posts[0]?.rationale).toContain("Chosen over");

    const snapshot = appModule.buildControlRoom(agentId);
    expect(snapshot?.runs).toHaveLength(1);
    expect(snapshot?.editorialLedger).toHaveLength(1);
    expect(snapshot?.editorialLedger[0]?.title).toBe(weakCandidate().title);
    expect(snapshot?.autonomy.postsPublished).toBe(1);
    expect(snapshot?.autonomy.candidatesRejected).toBe(1);
    expect(snapshot?.health.find((item) => item.key === "sources")?.state).toBe(
      "healthy",
    );
  });

  it("blocks exact duplicates from durable memory on the next cycle", async () => {
    const agentId = "agent-first-cycle";
    const registry = new SourceRegistry(
      [new FixedAdapter([strongCandidate(), weakCandidate()])],
      { retries: 0, timeoutMs: 1_000 },
    );

    const result = await workerModule.runAgentOnce(agentId, {
      sourceRegistry: registry,
      clock: () => new Date(NOW.getTime() + 60_000),
      runtime: { scheduleJitterMs: 0 },
    });

    expect(result).toMatchObject({
      discovered: 2,
      duplicates: 2,
      published: 0,
      rejected: 2,
    });
    expect(dbModule.getPosts(agentId)).toHaveLength(1);
    expect(dbModule.countRejected(agentId)).toBe(3);
  });

  it("uses a durable lease so concurrent workers cannot double-publish", async () => {
    const agentId = "agent-concurrency";
    dbModule.createAgent({
      agentId,
      personaName: "Mira",
      personaDomain: "AI Reliability & Security",
      initializedAt: NOW.toISOString(),
      nextRunAt: NOW.toISOString(),
    });
    const registry = new SourceRegistry(
      [new FixedAdapter([strongCandidate()], 50)],
      { retries: 0, timeoutMs: 1_000 },
    );

    const results = await Promise.all([
      workerModule.runAgentOnce(agentId, { sourceRegistry: registry }),
      workerModule.runAgentOnce(agentId, { sourceRegistry: registry }),
    ]);

    expect(results.filter((result) => result.skipped)).toHaveLength(1);
    expect(dbModule.getPosts(agentId)).toHaveLength(1);
  });

  it("runs due agents without any feed or browser request", async () => {
    const agentId = "agent-scheduled";
    dbModule.createAgent({
      agentId,
      personaName: "Mira",
      personaDomain: "AI Reliability & Security",
      initializedAt: NOW.toISOString(),
      nextRunAt: NOW.toISOString(),
    });

    const result = await schedulerModule.runDueAgentsOnce({
      clock: () => NOW,
      runtime: { scheduleJitterMs: 0 },
      sourceRegistryFactory: () =>
        new SourceRegistry([new FixedAdapter([strongCandidate()])], {
          retries: 0,
          timeoutMs: 1_000,
        }),
    });

    expect(result).toEqual({ due: 1, completed: 1, failed: 0 });
    expect(dbModule.getPosts(agentId)).toHaveLength(1);
  });

  it("retries a transient source failure within a bounded timeout", async () => {
    let attempts = 0;
    const adapter: SourceAdapter = {
      kind: "nvd",
      name: "Retry source",
      async fetchCandidates() {
        attempts += 1;

        if (attempts === 1) {
          throw new Error("temporary upstream failure");
        }

        return [strongCandidate()];
      },
    };
    const registry = new SourceRegistry([adapter], {
      retries: 1,
      retryDelayMs: 1,
      timeoutMs: 500,
    });

    const [result] = await registry.fetchAll();
    expect(result?.error).toBeNull();
    expect(result?.attempts).toBe(2);
    expect(result?.candidates).toHaveLength(1);
  });
});

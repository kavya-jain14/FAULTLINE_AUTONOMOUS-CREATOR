import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export interface AgentRecord {
  agentId: string;
  personaName: string;
  personaDomain: string;
  initializedAt: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  workerState:
    | "idle"
    | "discovering"
    | "judging"
    | "publishing"
    | "degraded";
}

export interface PostRecord {
  id: string;
  agentId: string;
  createdAt: string;
  text: string;
  rationale: string;
  sources: string[];
}

const databasePath = resolve(
  process.env.FAULTLINE_DB_PATH ??
    fileURLToPath(
      new URL("../data/faultline.sqlite", import.meta.url),
    ),
);
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    persona_name TEXT NOT NULL,
    persona_domain TEXT NOT NULL,
    initialized_at TEXT NOT NULL,
    next_run_at TEXT,
    last_run_at TEXT,
    worker_state TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    text TEXT NOT NULL,
    rationale TEXT NOT NULL,
    sources_json TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );

  CREATE INDEX IF NOT EXISTS idx_posts_agent_created
    ON posts(agent_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    discovered INTEGER NOT NULL DEFAULT 0,
    rejected INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 0,
    summary TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );

  CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    final_score INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source_url TEXT NOT NULL,
    decided_at TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );
`);

export function createAgent(input: {
  agentId: string;
  personaName: string;
  personaDomain: string;
  initializedAt: string;
  nextRunAt: string;
}): AgentRecord {
  db.prepare(`
    INSERT INTO agents (
      agent_id,
      persona_name,
      persona_domain,
      initialized_at,
      next_run_at,
      last_run_at,
      worker_state
    )
    VALUES (?, ?, ?, ?, ?, NULL, 'idle')
  `).run(
    input.agentId,
    input.personaName,
    input.personaDomain,
    input.initializedAt,
    input.nextRunAt,
  );

  const agent = getAgent(input.agentId);

  if (!agent) {
    throw new Error("Agent was not persisted.");
  }

  return agent;
}

export function getAgent(agentId: string): AgentRecord | null {
  const row = db
    .prepare(`
      SELECT
        agent_id AS agentId,
        persona_name AS personaName,
        persona_domain AS personaDomain,
        initialized_at AS initializedAt,
        next_run_at AS nextRunAt,
        last_run_at AS lastRunAt,
        worker_state AS workerState
      FROM agents
      WHERE agent_id = ?
    `)
    .get(agentId) as AgentRecord | undefined;

  return row ?? null;
}

export function getPosts(agentId: string): PostRecord[] {
 const rows = db
  .prepare(`
    SELECT
      id,
      agent_id AS agentId,
      created_at AS createdAt,
      text,
      rationale,
      sources_json AS sourcesJson
    FROM posts
    WHERE agent_id = ?
    ORDER BY created_at DESC
  `)
  .all(agentId) as unknown as Array<{
    id: string;
    agentId: string;
    createdAt: string;
    text: string;
    rationale: string;
    sourcesJson: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    agentId: row.agentId,
    createdAt: row.createdAt,
    text: row.text,
    rationale: row.rationale,
    sources: JSON.parse(row.sourcesJson) as string[],
  }));
}

export function countPosts(agentId: string): number {
  const row = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM posts
      WHERE agent_id = ?
    `)
    .get(agentId) as { count: number };

  return Number(row.count);
}

export function countRejected(agentId: string): number {
  const row = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM decisions
      WHERE agent_id = ?
        AND final_score < 72
    `)
    .get(agentId) as { count: number };

  return Number(row.count);
}
export function createPost(input: {
  id: string;
  agentId: string;
  createdAt: string;
  text: string;
  rationale: string;
  sources: string[];
}): PostRecord {
  db.prepare(`
    INSERT INTO posts (
      id,
      agent_id,
      created_at,
      text,
      rationale,
      sources_json
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.agentId,
    input.createdAt,
    input.text,
    input.rationale,
    JSON.stringify(input.sources),
  );

  const posts = getPosts(input.agentId);

  const post = posts.find(
    (item) => item.id === input.id,
  );

  if (!post) {
    throw new Error("Post was not persisted.");
  }

  return post;
}
export function updateAgentWorkerState(
  agentId: string,
  input: {
    workerState: AgentRecord["workerState"];
    lastRunAt?: string | null;
    nextRunAt?: string | null;
  },
): AgentRecord {
  const current = getAgent(agentId);

  if (!current) {
    throw new Error(
      `Agent ${agentId} does not exist.`,
    );
  }

  db.prepare(`
    UPDATE agents
    SET
      worker_state = ?,
      last_run_at = ?,
      next_run_at = ?
    WHERE agent_id = ?
  `).run(
    input.workerState,
    input.lastRunAt ?? current.lastRunAt,
    input.nextRunAt ?? current.nextRunAt,
    agentId,
  );

  const updated = getAgent(agentId);

  if (!updated) {
    throw new Error(
      "Agent was not updated.",
    );
  }

  return updated;
}

export function createRun(input: {
  id: string;
  agentId: string;
  startedAt: string;
}): void {
  db.prepare(`
    INSERT INTO runs (
      id,
      agent_id,
      started_at,
      completed_at,
      status,
      discovered,
      rejected,
      published,
      summary
    )
    VALUES (?, ?, ?, NULL, 'running', 0, 0, 0, '')
  `).run(
    input.id,
    input.agentId,
    input.startedAt,
  );
}

export function completeRun(input: {
  id: string;
  completedAt: string;
  status: "completed" | "degraded" | "failed";
  discovered: number;
  rejected: number;
  published: number;
  summary: string;
}): void {
  db.prepare(`
    UPDATE runs
    SET
      completed_at = ?,
      status = ?,
      discovered = ?,
      rejected = ?,
      published = ?,
      summary = ?
    WHERE id = ?
  `).run(
    input.completedAt,
    input.status,
    input.discovered,
    input.rejected,
    input.published,
    input.summary,
    input.id,
  );
}

export function createDecision(input: {
  id: string;
  agentId: string;
  title: string;
  finalScore: number;
  reason: string;
  sourceUrl: string;
  decidedAt: string;
}): void {
  db.prepare(`
    INSERT INTO decisions (
      id,
      agent_id,
      title,
      final_score,
      reason,
      source_url,
      decided_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.agentId,
    input.title,
    input.finalScore,
    input.reason,
    input.sourceUrl,
    input.decidedAt,
  );
}
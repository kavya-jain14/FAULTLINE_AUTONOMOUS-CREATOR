import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export type WorkerState =
  | "idle"
  | "discovering"
  | "judging"
  | "publishing"
  | "degraded";

export interface AgentRecord {
  agentId: string;
  personaName: string;
  personaDomain: string;
  initializedAt: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  workerState: WorkerState;
  workerHeartbeatAt: string | null;
  lockToken: string | null;
  lockedUntil: string | null;
}

export interface PostRecord {
  id: string;
  agentId: string;
  fingerprint: string | null;
  createdAt: string;
  text: string;
  rationale: string;
  sources: string[];
}

export interface DecisionRecord {
  id: string;
  runId: string | null;
  agentId: string;
  title: string;
  finalScore: number;
  verdict: "publish" | "reject";
  reason: string;
  sourceUrl: string;
  decidedAt: string;
}

export interface RunRecord {
  id: string;
  agentId: string;
  startedAt: string;
  completedAt: string | null;
  status: "running" | "completed" | "partial" | "failed";
  discovered: number;
  rejected: number;
  published: number;
  summary: string;
}

export interface MemoryRecord {
  agentId: string;
  fingerprint: string;
  sourceId: string;
  sourceKind: string;
  title: string;
  summary: string;
  canonicalUrl: string;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
  publishedPostId: string | null;
}

export interface SourceHealthRecord {
  key: string;
  label: string;
  state: "healthy" | "degraded" | "offline" | "unknown";
  detail: string;
  checkedAt: string;
}

const databasePath = resolve(
  process.env.FAULTLINE_DB_PATH ??
    fileURLToPath(new URL("../data/faultline.sqlite", import.meta.url)),
);

mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS agents (
    agent_id TEXT PRIMARY KEY,
    persona_name TEXT NOT NULL,
    persona_domain TEXT NOT NULL,
    initialized_at TEXT NOT NULL,
    next_run_at TEXT,
    last_run_at TEXT,
    worker_state TEXT NOT NULL,
    worker_heartbeat_at TEXT,
    lock_token TEXT,
    locked_until TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    fingerprint TEXT,
    created_at TEXT NOT NULL,
    text TEXT NOT NULL,
    rationale TEXT NOT NULL,
    sources_json TEXT NOT NULL,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );

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
    run_id TEXT,
    agent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    final_score INTEGER NOT NULL,
    verdict TEXT NOT NULL DEFAULT 'reject',
    reason TEXT NOT NULL,
    source_url TEXT NOT NULL,
    decided_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(id),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );

  CREATE TABLE IF NOT EXISTS memories (
    agent_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    source_id TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    seen_count INTEGER NOT NULL DEFAULT 1,
    published_post_id TEXT,
    PRIMARY KEY (agent_id, fingerprint),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    FOREIGN KEY (published_post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS source_health (
    source_key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    state TEXT NOT NULL,
    detail TEXT NOT NULL,
    checked_at TEXT NOT NULL
  );
`);

function columnNames(table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{
    name: string;
  }>;

  return new Set(rows.map((row) => row.name));
}

function ensureColumn(
  table: "agents" | "posts" | "decisions",
  name: string,
  definition: string,
): void {
  if (!columnNames(table).has(name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

ensureColumn("agents", "worker_heartbeat_at", "TEXT");
ensureColumn("agents", "lock_token", "TEXT");
ensureColumn("agents", "locked_until", "TEXT");
ensureColumn("posts", "fingerprint", "TEXT");
ensureColumn("decisions", "run_id", "TEXT");
ensureColumn("decisions", "verdict", "TEXT NOT NULL DEFAULT 'reject'");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_agents_due
    ON agents(next_run_at);

  CREATE INDEX IF NOT EXISTS idx_posts_agent_created
    ON posts(agent_id, created_at DESC);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_agent_fingerprint
    ON posts(agent_id, fingerprint)
    WHERE fingerprint IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_runs_agent_started
    ON runs(agent_id, started_at DESC);

  CREATE INDEX IF NOT EXISTS idx_decisions_agent_decided
    ON decisions(agent_id, decided_at DESC);
`);

export function withTransaction<T>(operation: () => T): T {
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = operation();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createAgent(input: {
  agentId: string;
  personaName: string;
  personaDomain: string;
  initializedAt: string;
  nextRunAt: string;
}): AgentRecord {
  db.prepare(`
    INSERT INTO agents (
      agent_id, persona_name, persona_domain, initialized_at,
      next_run_at, last_run_at, worker_state, worker_heartbeat_at,
      lock_token, locked_until
    ) VALUES (?, ?, ?, ?, ?, NULL, 'idle', NULL, NULL, NULL)
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
  const row = db.prepare(`
    SELECT
      agent_id AS agentId,
      persona_name AS personaName,
      persona_domain AS personaDomain,
      initialized_at AS initializedAt,
      next_run_at AS nextRunAt,
      last_run_at AS lastRunAt,
      worker_state AS workerState,
      worker_heartbeat_at AS workerHeartbeatAt,
      lock_token AS lockToken,
      locked_until AS lockedUntil
    FROM agents
    WHERE agent_id = ?
  `).get(agentId) as unknown as AgentRecord | undefined;

  return row ?? null;
}

export function getDueAgentIds(now: string, limit = 25): string[] {
  const rows = db.prepare(`
    SELECT agent_id AS agentId
    FROM agents
    WHERE next_run_at IS NOT NULL
      AND next_run_at <= ?
      AND (locked_until IS NULL OR locked_until <= ?)
    ORDER BY next_run_at ASC
    LIMIT ?
  `).all(now, now, limit) as unknown as Array<{ agentId: string }>;

  return rows.map((row) => row.agentId);
}

export function acquireAgentLease(input: {
  agentId: string;
  token: string;
  now: string;
  lockedUntil: string;
}): boolean {
  const result = db.prepare(`
    UPDATE agents
    SET lock_token = ?, locked_until = ?
    WHERE agent_id = ?
      AND (locked_until IS NULL OR locked_until <= ?)
  `).run(input.token, input.lockedUntil, input.agentId, input.now);

  return Number(result.changes) === 1;
}

export function releaseAgentLease(agentId: string, token: string): void {
  db.prepare(`
    UPDATE agents
    SET lock_token = NULL, locked_until = NULL
    WHERE agent_id = ? AND lock_token = ?
  `).run(agentId, token);
}

export function touchWorkerHeartbeat(checkedAt: string): void {
  db.prepare(`
    UPDATE agents
    SET worker_heartbeat_at = ?
  `).run(checkedAt);
}

export function updateAgentWorkerState(
  agentId: string,
  input: {
    workerState: WorkerState;
    lastRunAt?: string | null;
    nextRunAt?: string | null;
    workerHeartbeatAt?: string | null;
  },
): AgentRecord {
  const current = getAgent(agentId);

  if (!current) {
    throw new Error(`Agent ${agentId} does not exist.`);
  }

  const has = (key: keyof typeof input): boolean =>
    Object.prototype.hasOwnProperty.call(input, key);

  db.prepare(`
    UPDATE agents
    SET worker_state = ?, last_run_at = ?, next_run_at = ?,
        worker_heartbeat_at = ?
    WHERE agent_id = ?
  `).run(
    input.workerState,
    has("lastRunAt") ? input.lastRunAt ?? null : current.lastRunAt,
    has("nextRunAt") ? input.nextRunAt ?? null : current.nextRunAt,
    has("workerHeartbeatAt")
      ? input.workerHeartbeatAt ?? null
      : current.workerHeartbeatAt,
    agentId,
  );

  const updated = getAgent(agentId);

  if (!updated) {
    throw new Error("Agent was not updated.");
  }

  return updated;
}

export function getPosts(agentId: string): PostRecord[] {
  const rows = db.prepare(`
    SELECT id, agent_id AS agentId, fingerprint,
      created_at AS createdAt, text, rationale,
      sources_json AS sourcesJson
    FROM posts
    WHERE agent_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(agentId) as unknown as Array<{
    id: string;
    agentId: string;
    fingerprint: string | null;
    createdAt: string;
    text: string;
    rationale: string;
    sourcesJson: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    agentId: row.agentId,
    fingerprint: row.fingerprint,
    createdAt: row.createdAt,
    text: row.text,
    rationale: row.rationale,
    sources: JSON.parse(row.sourcesJson) as string[],
  }));
}

export function countPosts(agentId: string): number {
  const row = db.prepare(`
    SELECT COUNT(*) AS count FROM posts WHERE agent_id = ?
  `).get(agentId) as { count: number };

  return Number(row.count);
}

export function createPost(input: {
  id: string;
  agentId: string;
  fingerprint: string;
  createdAt: string;
  text: string;
  rationale: string;
  sources: string[];
}): PostRecord {
  db.prepare(`
    INSERT INTO posts (
      id, agent_id, fingerprint, created_at, text, rationale, sources_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.agentId,
    input.fingerprint,
    input.createdAt,
    input.text,
    input.rationale,
    JSON.stringify(input.sources),
  );

  const post = getPosts(input.agentId).find((item) => item.id === input.id);

  if (!post) {
    throw new Error("Post was not persisted.");
  }

  return post;
}

export function countRejected(agentId: string): number {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM decisions
    WHERE agent_id = ? AND verdict = 'reject'
  `).get(agentId) as { count: number };

  return Number(row.count);
}

export function createRun(input: {
  id: string;
  agentId: string;
  startedAt: string;
}): void {
  db.prepare(`
    INSERT INTO runs (
      id, agent_id, started_at, completed_at, status,
      discovered, rejected, published, summary
    ) VALUES (?, ?, ?, NULL, 'running', 0, 0, 0, 'Run in progress.')
  `).run(input.id, input.agentId, input.startedAt);
}

export function completeRun(input: {
  id: string;
  completedAt: string;
  status: "completed" | "partial" | "failed";
  discovered: number;
  rejected: number;
  published: number;
  summary: string;
}): void {
  db.prepare(`
    UPDATE runs
    SET completed_at = ?, status = ?, discovered = ?, rejected = ?,
        published = ?, summary = ?
    WHERE id = ?
  `).run(
    input.completedAt,
    input.status,
    input.discovered,
    input.rejected,
    input.published,
    input.summary.slice(0, 500),
    input.id,
  );
}

export function getRuns(agentId: string, limit = 100): RunRecord[] {
  return db.prepare(`
    SELECT id, agent_id AS agentId, started_at AS startedAt,
      completed_at AS completedAt, status, discovered, rejected,
      published, summary
    FROM runs
    WHERE agent_id = ?
    ORDER BY started_at DESC, id DESC
    LIMIT ?
  `).all(agentId, limit) as unknown as RunRecord[];
}

export function createDecision(input: {
  id: string;
  runId: string;
  agentId: string;
  title: string;
  finalScore: number;
  verdict: "publish" | "reject";
  reason: string;
  sourceUrl: string;
  decidedAt: string;
}): void {
  db.prepare(`
    INSERT INTO decisions (
      id, run_id, agent_id, title, final_score, verdict,
      reason, source_url, decided_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.runId,
    input.agentId,
    input.title,
    input.finalScore,
    input.verdict,
    input.reason.slice(0, 1_000),
    input.sourceUrl,
    input.decidedAt,
  );
}

export function getDecisions(agentId: string, limit = 100): DecisionRecord[] {
  return db.prepare(`
    SELECT id, run_id AS runId, agent_id AS agentId, title,
      final_score AS finalScore, verdict, reason,
      source_url AS sourceUrl, decided_at AS decidedAt
    FROM decisions
    WHERE agent_id = ?
    ORDER BY decided_at DESC, id DESC
    LIMIT ?
  `).all(agentId, limit) as unknown as DecisionRecord[];
}

export function getMemory(
  agentId: string,
  fingerprint: string,
): MemoryRecord | null {
  const row = db.prepare(`
    SELECT agent_id AS agentId, fingerprint, source_id AS sourceId,
      source_kind AS sourceKind, title, summary,
      canonical_url AS canonicalUrl, first_seen_at AS firstSeenAt,
      last_seen_at AS lastSeenAt, seen_count AS seenCount,
      published_post_id AS publishedPostId
    FROM memories
    WHERE agent_id = ? AND fingerprint = ?
  `).get(agentId, fingerprint) as unknown as MemoryRecord | undefined;

  return row ?? null;
}

export function listMemories(agentId: string, limit = 500): MemoryRecord[] {
  return db.prepare(`
    SELECT agent_id AS agentId, fingerprint, source_id AS sourceId,
      source_kind AS sourceKind, title, summary,
      canonical_url AS canonicalUrl, first_seen_at AS firstSeenAt,
      last_seen_at AS lastSeenAt, seen_count AS seenCount,
      published_post_id AS publishedPostId
    FROM memories
    WHERE agent_id = ?
    ORDER BY last_seen_at DESC
    LIMIT ?
  `).all(agentId, limit) as unknown as MemoryRecord[];
}

export function upsertMemory(input: Omit<MemoryRecord, "seenCount" | "publishedPostId">): MemoryRecord {
  db.prepare(`
    INSERT INTO memories (
      agent_id, fingerprint, source_id, source_kind, title, summary,
      canonical_url, first_seen_at, last_seen_at, seen_count, published_post_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)
    ON CONFLICT(agent_id, fingerprint) DO UPDATE SET
      last_seen_at = excluded.last_seen_at,
      seen_count = memories.seen_count + 1
  `).run(
    input.agentId,
    input.fingerprint,
    input.sourceId,
    input.sourceKind,
    input.title,
    input.summary,
    input.canonicalUrl,
    input.firstSeenAt,
    input.lastSeenAt,
  );

  const record = getMemory(input.agentId, input.fingerprint);

  if (!record) {
    throw new Error("Editorial memory was not persisted.");
  }

  return record;
}

export function markMemoryPublished(
  agentId: string,
  fingerprint: string,
  postId: string,
): void {
  db.prepare(`
    UPDATE memories
    SET published_post_id = ?
    WHERE agent_id = ? AND fingerprint = ?
  `).run(postId, agentId, fingerprint);
}

export function upsertSourceHealth(input: SourceHealthRecord): void {
  db.prepare(`
    INSERT INTO source_health (
      source_key, label, state, detail, checked_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(source_key) DO UPDATE SET
      label = excluded.label,
      state = excluded.state,
      detail = excluded.detail,
      checked_at = excluded.checked_at
  `).run(
    input.key,
    input.label,
    input.state,
    input.detail.slice(0, 300),
    input.checkedAt,
  );
}

export function getSourceHealth(): SourceHealthRecord[] {
  return db.prepare(`
    SELECT source_key AS key, label, state, detail, checked_at AS checkedAt
    FROM source_health
    ORDER BY source_key ASC
  `).all() as unknown as SourceHealthRecord[];
}

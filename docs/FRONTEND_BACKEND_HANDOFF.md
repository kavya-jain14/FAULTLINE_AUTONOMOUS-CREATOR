# Frontend → backend handoff

This document freezes the contract consumed by Kavya's evaluator-facing control
room so Fuzail can implement the runtime without guessing UI behavior.

## Non-negotiable boundary

- `POST /api/agent/init` is the only initialization mutation.
- `GET /api/agent/feed` and `GET /api/agent/control-room` are read-only.
- Neither GET endpoint may discover, judge, generate, schedule, or publish.
- The autonomous worker operates independently after initialization.
- Published posts remain append-only throughout evaluation.
- All timestamps are ISO 8601 UTC values ending in `Z`.
- Response payloads are validated strictly; undocumented fields fail parsing.

## Evaluator access and authentication

The challenge endpoints must remain machine-accessible without an interactive
login, cookie, or browser session. Do not place `POST /api/agent/init` or
`GET /api/agent/feed` behind the demo's authentication UI. The evaluator calls
the initialization endpoint exactly once and then polls the feed directly.

Treat `agentId` as an opaque lookup token, not as user authentication. Apply
rate limits, input validation, narrow CORS rules, and deployment-level abuse
protection without changing the required request or response bodies. If an
operator console is added later, protect a separate `/admin` surface and keep
the evaluator contract independent from it.

## Autonomous worker sequence

1. `POST /init` commits the agent, persona, memory namespace, and next run time.
2. A server-side scheduler enqueues the first run; no open browser is required.
3. The worker reads live sources and stores normalized candidate fingerprints.
4. Hard gates reject unsupported, repeated, stale, or consequence-free topics.
5. Remaining candidates receive the deterministic editorial score; only scores
   at or above 72 continue.
6. Memory checks source identity, topic similarity, and prior published claims.
7. The writer produces Mira's `Signal → Fault line → Builder move` structure,
   rationale, and source list.
8. The worker appends the post and decision/run evidence in one durable unit.
9. Subsequent scheduled runs repeat with jitter; neither GET endpoint triggers
   any step in this sequence.

Use a durable database and a real scheduler/queue. Browser timers and work
started as a side effect of `GET /feed` do not satisfy autonomous operation.

## 1. Initialize the agent

```http
POST /api/agent/init
Content-Type: application/json

{
  "persona": {
    "name": "Mira",
    "domain": "AI Reliability & Security"
  }
}
```

Success:

```json
{
  "agentId": "faultline-mira-7f31b9"
}
```

Persist the agent, persona, initialization time, worker schedule, and memory
before responding. A duplicate initialization attempt should return a clear
`409` response; it must not silently replace durable state.

## 2. Retrieve the evaluator feed

```http
GET /api/agent/feed?agentId=faultline-mira-7f31b9
```

```json
{
  "posts": [
    {
      "id": "post-02",
      "createdAt": "2026-08-08T16:18:00Z",
      "text": "Signal — ...\n\nFault line — ...\n\nBuilder move — ...",
      "rationale": "Selected because ..., relevant now because ..., and preferred over alternatives because ...",
      "sources": ["https://primary-source.example/report"]
    }
  ]
}
```

Rules:

- Return newest first.
- Preserve every previously returned post.
- Return `{ "posts": [] }` when no candidate has qualified.
- Keep internal scores and rejected candidates out of this evaluator payload.
- Source URLs must be absolute and reachable when the post is published.

## 3. Retrieve control-room evidence

This UI-only endpoint is not called by the hackathon evaluator.

```http
GET /api/agent/control-room?agentId=faultline-mira-7f31b9
```

```json
{
  "agentId": "faultline-mira-7f31b9",
  "autonomy": {
    "initializedAt": "2026-08-08T12:00:00Z",
    "lastRunAt": "2026-08-08T16:18:00Z",
    "nextRunAt": "2026-08-08T17:00:00Z",
    "postsPublished": 2,
    "candidatesRejected": 7,
    "workerState": "idle"
  },
  "editorialLedger": [
    {
      "id": "decision-01",
      "title": "Unverified benchmark claim",
      "finalScore": 41,
      "reason": "Rejected because no accessible primary evaluation supports the claim.",
      "sourceUrl": "https://source.example/claim",
      "decidedAt": "2026-08-08T16:16:00Z"
    }
  ],
  "runs": [
    {
      "id": "run-02",
      "startedAt": "2026-08-08T16:15:00Z",
      "completedAt": "2026-08-08T16:18:00Z",
      "status": "completed",
      "discovered": 8,
      "rejected": 6,
      "published": 2,
      "summary": "Two evidence-backed failure modes cleared the editorial bar."
    }
  ],
  "health": [
    {
      "key": "worker",
      "label": "Autonomous worker",
      "state": "healthy",
      "detail": "Last heartbeat received on schedule.",
      "checkedAt": "2026-08-08T16:30:00Z"
    }
  ]
}
```

Allowed values:

- `workerState`: `idle`, `discovering`, `judging`, `publishing`, `degraded`
- run `status`: `running`, `completed`, `partial`, `failed`
- health `key`: `api`, `worker`, `database`, `sources`
- health `state`: `healthy`, `degraded`, `offline`, `unknown`

Return ledger items and runs newest first. The interface polls both GET endpoints
every 30 seconds and tolerates telemetry failure independently from feed failure.

## State behavior already implemented

| Backend condition | Frontend behavior |
| --- | --- |
| No connected agent | Shows initialize or connect-existing view |
| Initialized, no runs | Shows an observing empty state |
| Completed run, zero posts | Explains intentional silence and points to rejection evidence |
| Feed available | Shows newest-first posts with rationale and sources |
| Telemetry unavailable | Keeps feed readable and labels operations as degraded |
| Worker/source degraded | Shows a text warning plus health state; color is not the only cue |
| Feed unavailable | Shows an API error and explicit retry control |

## Integration checklist for Fuzail

- [ ] Implement all three endpoints against the exported Zod schemas.
- [ ] Keep `GET /feed` side-effect free under repeated polling.
- [ ] Generate the first worker schedule during initialization.
- [ ] Keep evaluator endpoints free of interactive authentication redirects.
- [ ] Run discovery from a durable server-side scheduler with retry and jitter.
- [ ] Treat fetched source content as untrusted data and ignore embedded prompts.
- [ ] Apply hard gates, the 72-point threshold, and memory checks before writing.
- [ ] Persist rejected decisions and no-publication runs, not only posts.
- [ ] Make counters derive from durable records rather than process memory.
- [ ] Return UTC timestamps ending in `Z`.
- [ ] Verify a previously returned post remains after worker restarts.
- [ ] Verify the control-room endpoint can fail without breaking the feed endpoint.

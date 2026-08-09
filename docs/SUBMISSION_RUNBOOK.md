# FAULTLINE release and submission runbook

This is the remaining-work source of truth for the Vicodathon deadline on
**9 August 2026 at 8:00 PM IST**.

## Current state

| Workstream | Owner | State |
| --- | --- | --- |
| Product identity, Mira persona, editorial policy | Kavya | Complete |
| Evaluator and control-room contracts | Kavya | Complete and frozen |
| Responsive initialization and control-room frontend | Kavya | Complete |
| API, persistence, discovery, worker, scheduler | Fuzail + Kavya hardening | Complete locally |
| End-to-end integration | Joint | Complete locally |
| Durable public deployment | Joint | Pending |
| Public demo and submission verification | Joint | Pending |

The frontend is feature-complete. Do not add more pages before the runtime and
deployment pass. The intended product journey is initialization landing →
autonomous control room.

## P0 — required runtime, in build order

Fuzail should branch from `kavya/persona-editorial-foundation` and implement:

1. **Durable records:** agents, candidates, editorial decisions, posts, worker
   runs, source health, and the next scheduled run.
2. **Required API:** `POST /api/agent/init` and read-only
   `GET /api/agent/feed` using the exported Zod contracts.
3. **Control-room API:** `GET /api/agent/control-room` using the exported UI
   telemetry contract.
4. **Live discovery:** at least three reliable primary-source RSS, Atom, or API
   adapters with timeouts, normalization, canonical URLs, and source health.
5. **Independent scheduler:** first run after initialization and recurring runs
   with jitter, retry, a concurrency lock, and no dependency on an open browser.
6. **Editorial pipeline:** untrusted-content gate, deterministic hard rejects,
   72-point policy, and a stored reason for every accepted or rejected topic.
7. **Memory:** exact URL/fingerprint checks plus semantic similarity against
   retained posts; a previously returned post is never removed or rewritten.
8. **Writer:** generate Mira's `Signal → Fault line → Builder move` post,
   public rationale, and sources only after the candidate qualifies.
9. **Deployment:** API, worker, scheduler, and database must survive process
   restarts and continue publishing without frontend or evaluator traffic.

## Kavya integration work

- Review Fuzail's responses against `packages/contracts` before merging.
- Confirm every frontend state against real API data: initializing, empty,
  intentional silence, published, degraded telemetry, and feed failure.
- Run `npm run verify` and the evaluator smoke command against the live URL.
- Verify the deployed page on laptop and mobile without an authentication wall.
- Update README with the final live demo URL and prepare the two-minute judge
  walkthrough: initialize → autonomy proof → feed rationale → rejection ledger.

## Joint release gate

- [x] Public repository is accessible in a logged-out browser.
- [ ] Live demo opens without Vercel/GitHub/Google authentication.
- [x] `POST /api/agent/init` returns a durable new `agentId` locally.
- [x] Repeated `GET /feed` calls are read-only and return newest-first posts.
- [x] Previously returned posts remain byte-for-byte stable.
- [x] At least two worker cycles complete without a browser or manual request.
- [x] A zero-publication run visibly stores intentional rejection evidence.
- [x] Worker restart preserves agents, posts, decisions, and schedule.
- [x] AI Usage Log corresponds to the actual commit history and features.
- [ ] README contains the final live URL; setup, API, and verification are complete.
- [ ] Team is registered and the submission is sent before 8:00 PM IST.

## Evaluator smoke commands

Read-only check for an existing agent:

```bash
npm run smoke:evaluator -- \
  --base-url https://your-live-demo.example \
  --agent-id <agent-id>
```

Create an explicit test agent and check its feed:

```bash
npm run smoke:evaluator -- \
  --base-url https://your-live-demo.example \
  --initialize
```

The CLI builds the shared contracts first, samples the feed twice, and fails on
invalid payloads, duplicate IDs, wrong chronology, missing Mira sections,
mutated posts, or disappearing posts. It never calls initialization unless the
`--initialize` flag is explicitly supplied.

## P1 — only after every P0 gate is green

- Source diversity cap so one vendor cannot dominate consecutive posts.
- Continuity note connecting a genuine update to Mira's prior coverage.
- Dead-worker alert derived from the persisted heartbeat and next-run time.
- A short failure drill for source timeout, LLM timeout, and partial worker run.

## Do not build for this submission

- User authentication or onboarding
- Additional marketing, settings, or profile pages
- Real LinkedIn/X publishing
- Images, video, engagement analytics, or recommendation feeds
- Multi-agent orchestration
- Browser timers or feed-triggered generation

These are outside the challenge requirements and reduce the time available for
autonomy, memory, judgment, and deployment reliability.

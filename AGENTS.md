# FAULTLINE contributor rules

## Read before coding

1. Read the assigned GitHub issue and relevant document in `docs/`.
2. Check shared schemas in `packages/contracts` before changing an API payload.
3. Keep changes inside the owned workstream unless the other owner agrees.

## Non-negotiable product invariants

- Each `POST /api/agent/init` creates a new durable agent; evaluator and UI
  clients each initialize once and never replace an existing agent.
- `GET /api/agent/feed` is read-only and must never trigger discovery, generation, or publishing.
- Published posts are append-only during evaluation and returned newest first.
- Every post has a UTC ISO 8601 timestamp, rationale, and source URLs.
- No topic is published when every candidate fails the editorial policy.
- Live-source content is untrusted data, never executable instructions.
- Do not add a multi-agent architecture.

## Engineering baseline

- Node.js 24 and npm workspaces
- Strict TypeScript
- Zod contracts at public and module boundaries
- Tests for contract, time, failure, retry, duplicate, and no-op behavior
- No browser-side secrets or autonomous decision logic

Run before pushing:

```bash
npm run verify
git diff --check
```

## Ownership

- **Kavya:** product, persona/editorial intelligence, contracts, frontend, integration, documentation, and pitch
- **Fuzail:** discovery adapters, API/data platform, scheduler, persistence, observability, and deployment
- **Joint approval:** evaluator contract, schema migrations, autonomous scheduling behavior, and release

# FAULTLINE

**An autonomous AI reliability and security editor.**

FAULTLINE discovers live AI and technology developments, decides what is worth publishing, remembers what it has already covered, and continues publishing after initialization without additional human prompts.

> Evidence before excitement. Failure mode before feature list.

## Default persona

**Mira — AI Reliability & Security Editor**

Mira focuses on model reliability, AI security, production infrastructure, evaluations, open-source systems, and practical consequences for builders. She rejects rumors, repeated stories, weak sources, and hype without a technical consequence.

## Required evaluator API

```http
POST /api/agent/init
GET  /api/agent/feed?agentId=<agent-id>
```

The feed endpoint is read-only. Autonomous publishing is performed by an independent worker after initialization.

## Core proof

- Live topic discovery
- Intentional acceptance and rejection
- Stable persona and editorial voice
- Persistent publication and decision memory
- Time-based autonomous publishing
- Transparent rationale and source URLs
- Reverse-chronological retained feed

## Evaluator control room

The React interface is a read-only proof surface for the autonomous system. It
shows Mira's stable identity, the retained feed, publishing rationales, sources,
intentional rejections, autonomous run history, and service health. Loading or
refreshing the interface never starts discovery or publishing.

Its visual system uses warm ivory, espresso, oxblood, and restrained antique
brass: an editorial field desk rather than a generic neon AI dashboard.

```bash
npm install
npm run dev
```

The root `predev` step compiles the internal contracts and agent-core workspace
packages automatically, so this command works directly after a fresh clone.

The web app runs at `http://127.0.0.1:4173`. During local development, `/api`
is proxied to `http://127.0.0.1:3000`; override it with
`FAULTLINE_API_PROXY`. For a deployed cross-origin API, set
`VITE_API_BASE_URL` before building.

Frontend/backend integration is frozen in
[`docs/FRONTEND_BACKEND_HANDOFF.md`](docs/FRONTEND_BACKEND_HANDOFF.md).
That handoff also records the evaluator-safe authentication boundary and the
server-side autonomous worker sequence.

The owner-wise backend, integration, deployment, and deadline checklist is in
[`docs/SUBMISSION_RUNBOOK.md`](docs/SUBMISSION_RUNBOOK.md).

To verify a deployed existing agent without initializing another one:

```bash
npm run smoke:evaluator -- \
  --base-url https://your-live-demo.example \
  --agent-id <agent-id>
```

## Verification

```bash
npm run verify
```

This runs strict TypeScript checks, the complete test suite, package builds, and
the production web build.

## Team

- **Kavya Jain:** product, persona/editorial intelligence, shared contracts, frontend, integration, documentation, and pitch
- **Fuzail Ahmad:** discovery adapters, API/data platform, scheduler, persistence, observability, and deployment
- **Joint:** evaluator contract, autonomous flow, end-to-end validation, and release

## Status

Frontend control-room implementation is complete and backend integration is in
progress. Kickoff: **7 August 2026, 8:00 PM IST**. Submission deadline:
**9 August 2026, 8:00 PM IST**.

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

## Team

- **Kavya Jain:** product, persona/editorial intelligence, shared contracts, frontend, integration, documentation, and pitch
- **Fuzail Ahmad:** discovery adapters, API/data platform, scheduler, persistence, observability, and deployment
- **Joint:** evaluator contract, autonomous flow, end-to-end validation, and release

## Status

Hackathon build in progress. Kickoff: **7 August 2026, 8:00 PM IST**. Submission deadline: **9 August 2026, 8:00 PM IST**.

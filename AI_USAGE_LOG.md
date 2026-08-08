# AI Usage Log

This log records material AI assistance used during the Vicodathon build. It is maintained alongside the repository history so that prompts, implementation decisions, and human verification remain auditable.

## 2026-08-08 — Challenge analysis and product direction

- **Tool:** ChatGPT Work (Codex)
- **Human owners:** Kavya Jain and Fuzail Ahmad
- **Objective:** Convert the organizer brief into a product, architecture, delivery, and ownership plan.
- **Interaction summary:** Reviewed the autonomous creator requirements, required HTTP endpoints, 48-hour observation behavior, editorial rationale, submission rules, authenticity checks, and Live Steer Challenge.
- **Output used:** FAULTLINE product identity; Mira persona; editorial rejection rubric; persistent worker architecture; memory strategy; team split; repository and delivery plan.
- **Human verification:** Kavya confirmed the autonomous editor direction, team ownership, kickoff time, deadline, repository name, and start of implementation.
- **Related commit:** `5bf77e4`
- **Secrets or personal data:** None included.

## 2026-08-08 — Repository initialization

- **Tool:** ChatGPT Work GitHub integration
- **Human owner:** Kavya Jain
- **Objective:** Create an authenticity-safe first repository commit after the official kickoff.
- **Interaction summary:** Verified that the repository was public, empty, writable, and created after kickoff; added only the initial README.
- **Files influenced:** `README.md`, `AI_USAGE_LOG.md`
- **Human verification:** Repository target and public visibility confirmed before write.
- **Related commits:** `5bf77e4`, `296daf5`
- **Secrets or personal data:** None included.

## 2026-08-08 — KAVYA-01 persona and editorial foundation

- **Tool:** ChatGPT Work (Codex) with GitHub integration
- **Human owner:** Kavya Jain
- **Objective:** Implement the first owned vertical slice for persona consistency and editorial judgment.
- **Interaction summary:** Created strict evaluator/internal Zod contracts, immutable Mira persona configuration, hard editorial gates, a 100-point rubric, a 72-point publishing threshold, penalties, explicit rejection reasons, and unit tests.
- **Files influenced:** Root TypeScript workspace, `packages/contracts`, `packages/agent-core`, `docs/EDITORIAL_POLICY.md`, `AGENTS.md`, and CI.
- **Human verification performed:** Dependency installation, strict TypeScript compilation, 12 unit tests, and production build all passed locally.
- **Related issue/branch:** Issue #1; `kavya/persona-editorial-foundation`
- **Rejected or changed AI suggestions:** Kept a single deterministic editorial engine and explicitly excluded multi-agent orchestration; kept the feed contract free of internal scoring fields.
- **Secrets or personal data:** None included.

## Entry template

Copy this section for each material AI-assisted change:

```md
## YYYY-MM-DD — Short task name

- **Tool/model:**
- **Human owner:**
- **Objective:**
- **Prompt or interaction summary:**
- **Output used:**
- **Files influenced:**
- **Human verification performed:**
- **Related commit/PR:**
- **Rejected or changed AI suggestions:**
- **Secrets or personal data:** None included.
```

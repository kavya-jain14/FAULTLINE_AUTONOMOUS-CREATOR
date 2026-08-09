# FAULTLINE deployment checklist

FAULTLINE needs a long-running Node process and durable storage. A static-only
Vercel deployment cannot satisfy the autonomous worker requirement by itself.
The repository therefore ships one container that serves the React app, API,
and embedded scheduler.

## Railway release

1. Create a Railway service from the public GitHub repository and select the
   release branch.
2. Let Railway use the included `Dockerfile` / `railway.json`.
3. Attach a persistent volume mounted at `/data`.
4. Confirm these variables:

   ```text
   FAULTLINE_DB_PATH=/data/faultline.sqlite
   FAULTLINE_INITIAL_DELAY_MS=8000
   FAULTLINE_INTERVAL_MS=1800000
   FAULTLINE_SCHEDULE_JITTER_MS=120000
   FAULTLINE_SOURCE_TIMEOUT_MS=12000
   FAULTLINE_SOURCE_RETRIES=1
   ```

   Railway supplies `PORT`; the image already uses `HOST=0.0.0.0`.
5. Generate a public domain and verify that `/`, `/health`, and the required
   API endpoints are available without a login wall.

## Release proof

Initialize a dedicated release-test agent exactly once:

```bash
curl -sS -X POST https://YOUR_DOMAIN/api/agent/init \
  -H 'Content-Type: application/json' \
  --data '{"persona":{"name":"Mira","domain":"AI Reliability & Security"}}'
```

Save the returned `agentId`. Do not repeatedly initialize the same test flow.
Wait for the first scheduled cycle, then run:

```bash
npm run smoke:evaluator -- \
  --base-url https://YOUR_DOMAIN \
  --agent-id YOUR_AGENT_ID \
  --samples 3 \
  --interval-seconds 10
```

Final checks:

- the feed gains a post without a manual run endpoint or open browser;
- a later zero-publication cycle appears in the control-room run timeline;
- restarting the service preserves the agent, posts, decisions, and schedule;
- source, worker, API, and database health are truthful;
- the final domain is added to README and the hackathon submission.

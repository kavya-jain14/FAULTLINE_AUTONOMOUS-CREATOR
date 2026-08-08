import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  FeedResponseSchema,
  InitializeAgentResponseSchema,
} from "../packages/contracts/dist/index.js";

const MIRA_INITIALIZATION = Object.freeze({
  persona: Object.freeze({
    name: "Mira",
    domain: "AI Reliability & Security",
  }),
});

function requiredInteger(value, name, { min, max }) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  }
  return parsed;
}

function normalizedBaseUrl(value) {
  if (!value) throw new Error("--base-url is required.");
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("--base-url must use http or https.");
  }
  return url.href.replace(/\/$/, "");
}

function hasSection(text, section) {
  return new RegExp(`(?:^|\\n)${section}\\s*[—:–-]`, "i").test(text);
}

export function inspectFeed(payload) {
  const feed = FeedResponseSchema.parse(payload);
  const seenIds = new Set();
  let previousTimestamp = Number.POSITIVE_INFINITY;

  for (const post of feed.posts) {
    if (seenIds.has(post.id)) {
      throw new Error(`Feed contains duplicate post id: ${post.id}`);
    }
    seenIds.add(post.id);

    const timestamp = Date.parse(post.createdAt);
    if (timestamp > previousTimestamp) {
      throw new Error("Feed posts are not in reverse chronological order.");
    }
    previousTimestamp = timestamp;

    for (const section of ["Signal", "Fault line", "Builder move"]) {
      if (!hasSection(post.text, section)) {
        throw new Error(`Post ${post.id} is missing the ${section} section.`);
      }
    }
  }

  return feed;
}

export function assertRetainedPosts(previousFeed, currentFeed) {
  const currentById = new Map(currentFeed.posts.map((post) => [post.id, post]));

  for (const previousPost of previousFeed.posts) {
    const currentPost = currentById.get(previousPost.id);
    if (!currentPost) {
      throw new Error(`Previously returned post disappeared: ${previousPost.id}`);
    }
    if (!isDeepStrictEqual(currentPost, previousPost)) {
      throw new Error(`Previously returned post changed: ${previousPost.id}`);
    }
  }
}

async function requestJson(url, options, timeoutSeconds) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    signal: AbortSignal.timeout(timeoutSeconds * 1_000),
  });

  const rawBody = await response.text();
  let payload;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error(`${response.status} ${url} returned non-JSON content.`);
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${url}: ${rawBody.slice(0, 300)}`);
  }

  return payload;
}

function printUsage() {
  process.stdout.write(`FAULTLINE evaluator smoke\n\n`);
  process.stdout.write(`Read-only existing agent:\n`);
  process.stdout.write(
    `  npm run smoke:evaluator -- --base-url https://demo.example --agent-id <id>\n\n`,
  );
  process.stdout.write(`Explicit test initialization:\n`);
  process.stdout.write(
    `  npm run smoke:evaluator -- --base-url https://demo.example --initialize\n\n`,
  );
  process.stdout.write(
    `Optional: --samples 2 --interval-seconds 1 --timeout-seconds 15\n`,
  );
}

export async function run(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      "base-url": { type: "string" },
      "agent-id": { type: "string" },
      initialize: { type: "boolean", default: false },
      samples: { type: "string", default: "2" },
      "interval-seconds": { type: "string", default: "1" },
      "timeout-seconds": { type: "string", default: "15" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const baseUrl = normalizedBaseUrl(values["base-url"]);
  const samples = requiredInteger(values.samples, "--samples", { min: 2, max: 20 });
  const intervalSeconds = requiredInteger(values["interval-seconds"], "--interval-seconds", {
    min: 0,
    max: 3_600,
  });
  const timeoutSeconds = requiredInteger(values["timeout-seconds"], "--timeout-seconds", {
    min: 1,
    max: 60,
  });

  if (values.initialize && values["agent-id"]) {
    throw new Error("Use either --initialize or --agent-id, not both.");
  }
  if (!values.initialize && !values["agent-id"]) {
    throw new Error("Pass --agent-id for read-only checks or explicitly pass --initialize.");
  }

  let agentId = values["agent-id"]?.trim();
  if (values.initialize) {
    const payload = await requestJson(
      `${baseUrl}/api/agent/init`,
      { method: "POST", body: JSON.stringify(MIRA_INITIALIZATION) },
      timeoutSeconds,
    );
    agentId = InitializeAgentResponseSchema.parse(payload).agentId;
    process.stdout.write(`✓ initialized test agent ${agentId}\n`);
  } else {
    process.stdout.write(`✓ read-only mode for agent ${agentId}\n`);
  }

  if (!agentId) throw new Error("Agent id cannot be empty.");

  const feedUrl = `${baseUrl}/api/agent/feed?agentId=${encodeURIComponent(agentId)}`;
  let previousFeed;

  for (let sample = 1; sample <= samples; sample += 1) {
    const payload = await requestJson(feedUrl, { method: "GET" }, timeoutSeconds);
    const feed = inspectFeed(payload);
    if (previousFeed) assertRetainedPosts(previousFeed, feed);
    process.stdout.write(`✓ feed sample ${sample}/${samples}: ${feed.posts.length} posts\n`);
    previousFeed = feed;

    if (sample < samples && intervalSeconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1_000));
    }
  }

  process.stdout.write(`PASS evaluator contract and retention checks\n`);
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  run().catch((error) => {
    process.stderr.write(`FAIL ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

import { describe, expect, it } from "vitest";

import {
  FeedPostSchema,
  FeedResponseSchema,
  InitializeAgentRequestSchema,
} from "./agent.js";

describe("evaluator contracts", () => {
  it("accepts the required initialization request", () => {
    expect(
      InitializeAgentRequestSchema.parse({
        persona: { name: "Mira", domain: "AI Reliability & Security" },
      }),
    ).toEqual({
      persona: { name: "Mira", domain: "AI Reliability & Security" },
    });
  });

  it("rejects unknown public feed fields", () => {
    const result = FeedPostSchema.safeParse({
      id: "p1",
      createdAt: "2026-08-08T12:30:00Z",
      text: "Signal — a grounded update.",
      rationale: "Selected because it changes a builder decision.",
      sources: ["https://example.com/source"],
      internalScore: 92,
    });

    expect(result.success).toBe(false);
  });

  it("requires UTC timestamps ending in Z", () => {
    const result = FeedPostSchema.safeParse({
      id: "p1",
      createdAt: "2026-08-08T18:00:00+05:30",
      text: "Signal — a grounded update.",
      rationale: "Selected because it changes a builder decision.",
      sources: ["https://example.com/source"],
    });

    expect(result.success).toBe(false);
  });

  it("supports an empty feed", () => {
    expect(FeedResponseSchema.parse({ posts: [] })).toEqual({ posts: [] });
  });
});

import { describe, expect, it } from "vitest";

import { assertRetainedPosts, inspectFeed } from "./evaluator-smoke.mjs";

const post = {
  id: "p-1",
  createdAt: "2026-08-09T10:30:00Z",
  text: "Signal — Change.\n\nFault line — Risk.\n\nBuilder move — Verify it.",
  rationale: "Selected for current, evidence-backed builder impact over weaker candidates.",
  sources: ["https://example.com/source"],
};

describe("evaluator smoke inspection", () => {
  it("accepts a strict newest-first Mira feed and retained posts", () => {
    const first = inspectFeed({ posts: [post] });
    const second = inspectFeed({
      posts: [
        { ...post, id: "p-2", createdAt: "2026-08-09T10:31:00Z" },
        post,
      ],
    });

    expect(() => assertRetainedPosts(first, second)).not.toThrow();
  });

  it("rejects duplicate IDs and incorrect chronology", () => {
    expect(() => inspectFeed({ posts: [post, post] })).toThrow(/duplicate post id/i);
    expect(() =>
      inspectFeed({
        posts: [
          post,
          { ...post, id: "p-2", createdAt: "2026-08-09T10:31:00Z" },
        ],
      }),
    ).toThrow(/reverse chronological/i);
  });

  it("rejects posts that do not follow Mira's structure", () => {
    expect(() => inspectFeed({ posts: [{ ...post, text: "A generic AI post." }] })).toThrow(
      /missing the Signal section/i,
    );
  });

  it("rejects disappearing or mutated posts", () => {
    const first = inspectFeed({ posts: [post] });

    expect(() => assertRetainedPosts(first, inspectFeed({ posts: [] }))).toThrow(
      /disappeared/i,
    );
    expect(() =>
      assertRetainedPosts(
        first,
        inspectFeed({ posts: [{ ...post, rationale: "This record changed later." }] }),
      ),
    ).toThrow(/changed/i);
  });
});

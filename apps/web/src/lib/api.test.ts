// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { retrieveFeed } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("retrieveFeed", () => {
  it("uses a read-only GET and sorts published posts newest first", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          posts: [
            {
              id: "old",
              createdAt: "2026-08-08T10:00:00Z",
              text: "Old",
              rationale: "Older evidence.",
              sources: ["https://example.com/old"],
            },
            {
              id: "new",
              createdAt: "2026-08-08T11:00:00Z",
              text: "New",
              rationale: "Newer evidence.",
              sources: ["https://example.com/new"],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const posts = await retrieveFeed("agent-1");

    expect(posts.map((post) => post.id)).toEqual(["new", "old"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent/feed?agentId=agent-1",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

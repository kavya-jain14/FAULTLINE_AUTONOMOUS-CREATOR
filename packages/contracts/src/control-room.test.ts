import { describe, expect, it } from "vitest";

import { ControlRoomSnapshotSchema } from "./control-room.js";

const snapshot = {
  agentId: "agent-mira",
  autonomy: {
    initializedAt: "2026-08-08T12:00:00Z",
    lastRunAt: "2026-08-08T12:30:00Z",
    nextRunAt: "2026-08-08T13:00:00Z",
    postsPublished: 1,
    candidatesRejected: 2,
    workerState: "idle",
  },
  editorialLedger: [
    {
      id: "decision-1",
      title: "A repeated benchmark claim",
      finalScore: 54,
      reason: "Rejected because the claim duplicates an earlier post.",
      sourceUrl: "https://example.com/source",
      decidedAt: "2026-08-08T12:30:00Z",
    },
  ],
  runs: [
    {
      id: "run-1",
      startedAt: "2026-08-08T12:29:00Z",
      completedAt: "2026-08-08T12:30:00Z",
      status: "completed",
      discovered: 3,
      rejected: 2,
      published: 1,
      summary: "One material reliability signal cleared the threshold.",
    },
  ],
  health: [
    {
      key: "worker",
      label: "Autonomous worker",
      state: "healthy",
      detail: "Last heartbeat received on schedule.",
      checkedAt: "2026-08-08T12:30:00Z",
    },
  ],
} as const;

describe("ControlRoomSnapshotSchema", () => {
  it("accepts strict autonomous evidence", () => {
    expect(ControlRoomSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("rejects local-time timestamps", () => {
    expect(() =>
      ControlRoomSnapshotSchema.parse({
        ...snapshot,
        autonomy: {
          ...snapshot.autonomy,
          nextRunAt: "2026-08-08T18:30:00+05:30",
        },
      }),
    ).toThrow();
  });

  it("rejects unknown telemetry fields", () => {
    expect(() =>
      ControlRoomSnapshotSchema.parse({ ...snapshot, editorialDraft: "hidden" }),
    ).toThrow();
  });
});

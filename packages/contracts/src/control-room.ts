import { z } from "zod";

import { UtcIsoTimestampSchema } from "./agent.js";

export const WorkerStateSchema = z.enum([
  "idle",
  "discovering",
  "judging",
  "publishing",
  "degraded",
]);

export const ServiceHealthStateSchema = z.enum([
  "healthy",
  "degraded",
  "offline",
  "unknown",
]);

export const AutonomyStatusSchema = z
  .object({
    initializedAt: UtcIsoTimestampSchema,
    lastRunAt: UtcIsoTimestampSchema.nullable(),
    nextRunAt: UtcIsoTimestampSchema.nullable(),
    postsPublished: z.number().int().nonnegative(),
    candidatesRejected: z.number().int().nonnegative(),
    workerState: WorkerStateSchema,
  })
  .strict();

export const EditorialLedgerItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(500),
    finalScore: z.number().int().min(0).max(100),
    reason: z.string().trim().min(1).max(1_000),
    sourceUrl: z.string().url(),
    decidedAt: UtcIsoTimestampSchema,
  })
  .strict();

export const RunTimelineItemSchema = z
  .object({
    id: z.string().min(1),
    startedAt: UtcIsoTimestampSchema,
    completedAt: UtcIsoTimestampSchema.nullable(),
    status: z.enum(["running", "completed", "partial", "failed"]),
    discovered: z.number().int().nonnegative(),
    rejected: z.number().int().nonnegative(),
    published: z.number().int().nonnegative(),
    summary: z.string().trim().min(1).max(500),
  })
  .strict();

export const ServiceHealthItemSchema = z
  .object({
    key: z.enum(["api", "worker", "database", "sources"]),
    label: z.string().trim().min(1).max(80),
    state: ServiceHealthStateSchema,
    detail: z.string().trim().min(1).max(300),
    checkedAt: UtcIsoTimestampSchema,
  })
  .strict();

export const ControlRoomSnapshotSchema = z
  .object({
    agentId: z.string().min(1),
    autonomy: AutonomyStatusSchema,
    editorialLedger: z.array(EditorialLedgerItemSchema).max(100),
    runs: z.array(RunTimelineItemSchema).max(100),
    health: z.array(ServiceHealthItemSchema).max(8),
  })
  .strict();

export type WorkerState = z.infer<typeof WorkerStateSchema>;
export type ServiceHealthState = z.infer<typeof ServiceHealthStateSchema>;
export type AutonomyStatus = z.infer<typeof AutonomyStatusSchema>;
export type EditorialLedgerItem = z.infer<
  typeof EditorialLedgerItemSchema
>;
export type RunTimelineItem = z.infer<typeof RunTimelineItemSchema>;
export type ServiceHealthItem = z.infer<typeof ServiceHealthItemSchema>;
export type ControlRoomSnapshot = z.infer<typeof ControlRoomSnapshotSchema>;

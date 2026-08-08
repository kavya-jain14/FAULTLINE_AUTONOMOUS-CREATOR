import { z } from "zod";

export const UtcIsoTimestampSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value) => value.endsWith("Z"), {
    message: "Timestamp must be an ISO 8601 UTC value ending in Z",
  });

export const PersonaInitSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    domain: z.string().trim().min(2).max(120),
  })
  .strict();

export const InitializeAgentRequestSchema = z
  .object({
    persona: PersonaInitSchema,
  })
  .strict();

export const InitializeAgentResponseSchema = z
  .object({
    agentId: z.string().min(1),
  })
  .strict();

export const FeedPostSchema = z
  .object({
    id: z.string().min(1),
    createdAt: UtcIsoTimestampSchema,
    text: z.string().trim().min(1).max(4_000),
    rationale: z.string().trim().min(1).max(2_000),
    sources: z.array(z.string().url()).min(1).max(8),
  })
  .strict();

export const FeedResponseSchema = z
  .object({
    posts: z.array(FeedPostSchema),
  })
  .strict();

export const PersonaProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    domain: z.string().trim().min(2).max(120),
    role: z.string().trim().min(1).max(240),
    creed: z.string().trim().min(1).max(240),
    signatureQuestion: z.string().trim().min(1).max(320),
    interests: z.array(z.string().trim().min(1)).min(3).max(12),
    exclusions: z.array(z.string().trim().min(1)).min(3).max(12),
    voiceRules: z.array(z.string().trim().min(1)).min(3).max(12),
    postSections: z.tuple([
      z.literal("Signal"),
      z.literal("Fault line"),
      z.literal("Builder move"),
    ]),
  })
  .strict();

export const EditorialScoresSchema = z
  .object({
    personaRelevance: z.number().int().min(0).max(20),
    practicalImpact: z.number().int().min(0).max(20),
    freshness: z.number().int().min(0).max(15),
    sourceAuthority: z.number().int().min(0).max(15),
    novelty: z.number().int().min(0).max(15),
    insightPotential: z.number().int().min(0).max(15),
  })
  .strict();

export const EditorialPenaltiesSchema = z
  .object({
    speculation: z.number().int().min(0).max(15).default(0),
    nearDuplicate: z.number().int().min(0).max(30).default(0),
    inaccessibleSource: z.number().int().min(0).max(20).default(0),
    hypeWithoutConsequence: z.number().int().min(0).max(15).default(0),
  })
  .strict();

export const EditorialCandidateSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(500),
    summary: z.string().trim().min(1).max(5_000),
    canonicalUrl: z.string().url(),
    sourceUrls: z.array(z.string().url()).min(1).max(8),
    publishedAt: UtcIsoTimestampSchema.nullable(),
    isAiOrTechnology: z.boolean(),
    sourceReachable: z.boolean(),
    evidenceSupported: z.boolean(),
    promptInjectionDetected: z.boolean(),
    similarityToPublished: z.number().min(0).max(1),
    scores: EditorialScoresSchema,
    penalties: EditorialPenaltiesSchema,
  })
  .strict();

export const HardRejectionCodeSchema = z.enum([
  "off_domain",
  "source_unreachable",
  "unsupported_claim",
  "unsafe_source_content",
  "near_duplicate",
]);

export const EditorialDecisionSchema = z
  .object({
    candidateId: z.string().min(1),
    verdict: z.enum(["publish", "reject"]),
    baseScore: z.number().int().min(0).max(100),
    penaltyTotal: z.number().int().min(0).max(80),
    finalScore: z.number().int().min(0).max(100),
    hardRejections: z.array(HardRejectionCodeSchema),
    reason: z.string().trim().min(1).max(1_000),
    decidedAt: UtcIsoTimestampSchema,
  })
  .strict();

export const GeneratedPostSchema = z
  .object({
    text: z.string().trim().min(1).max(4_000),
    rationale: z
      .object({
        selectedBecause: z.string().trim().min(1).max(700),
        relevantNowBecause: z.string().trim().min(1).max(700),
        chosenOverAlternativesBecause: z.string().trim().min(1).max(700),
      })
      .strict(),
    sourceUrls: z.array(z.string().url()).min(1).max(8),
  })
  .strict();

export type PersonaInit = z.infer<typeof PersonaInitSchema>;
export type InitializeAgentRequest = z.infer<
  typeof InitializeAgentRequestSchema
>;
export type InitializeAgentResponse = z.infer<
  typeof InitializeAgentResponseSchema
>;
export type FeedPost = z.infer<typeof FeedPostSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
export type PersonaProfile = z.infer<typeof PersonaProfileSchema>;
export type EditorialScores = z.infer<typeof EditorialScoresSchema>;
export type EditorialPenalties = z.infer<typeof EditorialPenaltiesSchema>;
export type EditorialCandidate = z.infer<typeof EditorialCandidateSchema>;
export type HardRejectionCode = z.infer<typeof HardRejectionCodeSchema>;
export type EditorialDecision = z.infer<typeof EditorialDecisionSchema>;
export type GeneratedPost = z.infer<typeof GeneratedPostSchema>;

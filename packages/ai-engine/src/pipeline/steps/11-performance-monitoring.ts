import { z } from "zod";
import { prisma } from "@autoblog/database";
import type { PipelineStep, StepContext } from "../types.js";
import type { PublishingOutput } from "./10-publishing.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  postId: z.string(),
  publishedAt: z.string(),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  postId: z.string(),
  title: z.string(),
  slug: z.string(),
  keyword: z.string(),
  categoryName: z.string(),
  wordCount: z.number(),
  imageUrl: z.string(),
  linksCreated: z.number(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  secondaryKeywords: z.array(z.string()),
  readingTime: z.number(),
  seoScore: z.number(),
  suggestions: z.array(z.string()),
  publishedAt: z.string(),
  performanceId: z.string(),
});

export type PerformanceMonitoringInput = PublishingOutput;
export type PerformanceMonitoringOutput = z.infer<typeof outputSchema>;

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: PerformanceMonitoringInput,
  _context: StepContext,
): Promise<PerformanceMonitoringOutput> {
  // Create baseline performance tracking record (skip if one already exists for today — retry safety)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.postPerformance.findFirst({
    where: {
      postId: input.postId,
      date: { gte: today, lt: tomorrow },
    },
  });

  const perf = existing ?? await prisma.postPerformance.create({
    data: {
      postId: input.postId,
      date: new Date(),
      pageViews: 0,
      uniqueVisitors: 0,
    },
  });

  console.log(`    [Performance Monitoring] Tracking started for: ${input.slug}`);

  return {
    ...input,
    performanceId: perf.id,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const performanceMonitoring: PipelineStep<
  PerformanceMonitoringInput,
  PerformanceMonitoringOutput
> = {
  stepName: "performance-monitoring",
  inputSchema: inputSchema as unknown as z.ZodSchema<PerformanceMonitoringInput>,
  outputSchema,
  execute,
};

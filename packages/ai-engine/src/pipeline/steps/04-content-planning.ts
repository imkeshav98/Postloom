import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildContentPlanningPrompt,
  contentPlanningSchema,
} from "../../config/prompts/content-planning.js";
import type { PipelineStep, StepContext } from "../types.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  keywordId: z.string().optional(),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  keywordId: z.string(),
  keyword: z.string(),
  searchVolume: z.number(),
  difficulty: z.number(),
  intent: z.string(),
  contentPlanId: z.string(),
  title: z.string(),
  slug: z.string(),
  outline: z.array(z.object({
    heading: z.string(),
    level: z.number(),
    description: z.string(),
  })),
  targetWordCount: z.number(),
  contentType: z.string(),
  uniqueAngle: z.string(),
});

export type ContentPlanningInput = z.infer<typeof inputSchema>;
export type ContentPlanningOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AIContentPlanResponse {
  title: string;
  slug: string;
  outline: Array<{ heading: string; level: number; description: string }>;
  targetWordCount: number;
  contentType: string;
  uniqueAngle: string;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: ContentPlanningInput,
  context: StepContext,
): Promise<ContentPlanningOutput> {
  const config = await getModelConfig(context.blogId);

  // Pick keyword: use provided keywordId or find best unwritten keyword
  let keyword;

  if (input.keywordId) {
    keyword = await prisma.keyword.findUnique({
      where: { id: input.keywordId },
    });
    if (!keyword) throw new Error(`Keyword ${input.keywordId} not found`);
  } else {
    // Pick best keyword: high volume, high trend, low difficulty, no existing content plan
    const existingPlanKeywordIds = await prisma.contentPlan.findMany({
      where: { blogId: context.blogId },
      select: { targetKeywordId: true },
    });
    const usedIds = new Set(
      existingPlanKeywordIds.map((p) => p.targetKeywordId).filter(Boolean),
    );

    const candidates = await prisma.keyword.findMany({
      where: { blogId: context.blogId },
      orderBy: [{ searchVolume: "desc" }],
    });

    // Score: (searchVolume * (trendScore || 1)) / (difficulty || 50)
    keyword = candidates
      .filter((k) => !usedIds.has(k.id))
      .sort((a, b) => {
        const scoreA = ((a.searchVolume ?? 0) * (a.trendScore ?? 1)) / Math.max(a.difficulty ?? 50, 1);
        const scoreB = ((b.searchVolume ?? 0) * (b.trendScore ?? 1)) / Math.max(b.difficulty ?? 50, 1);
        return scoreB - scoreA;
      })[0];

    if (!keyword) throw new Error("No unused keywords available for content planning");
  }

  // Get existing post titles to avoid overlap
  const existingPosts = await prisma.post.findMany({
    where: { blogId: context.blogId },
    select: { title: true },
  });

  const result = await chatJSON<AIContentPlanResponse>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      {
        role: "user",
        content: buildContentPlanningPrompt(
          input.niche,
          keyword.keyword,
          keyword.searchVolume ?? 0,
          keyword.difficulty ?? 50,
          keyword.intent ?? "INFORMATIONAL",
          existingPosts.map((p) => p.title),
        ),
      },
    ],
    jsonSchema: contentPlanningSchema,
  });

  // Persist ContentPlan to database
  const plan = await prisma.contentPlan.create({
    data: {
      blogId: context.blogId,
      title: result.title,
      outline: result.outline,
      targetKeywordId: keyword.id,
      status: "IN_PROGRESS",
      clusterGroup: null,
      isHub: false,
    },
  });

  console.log(`    [Content Planning] Created plan: "${result.title}" (keyword: ${keyword.keyword})`);

  return {
    niche: input.niche,
    keywordId: keyword.id,
    keyword: keyword.keyword,
    searchVolume: keyword.searchVolume ?? 0,
    difficulty: keyword.difficulty ?? 50,
    intent: keyword.intent ?? "INFORMATIONAL",
    contentPlanId: plan.id,
    title: result.title,
    slug: result.slug,
    outline: result.outline,
    targetWordCount: result.targetWordCount,
    contentType: result.contentType,
    uniqueAngle: result.uniqueAngle,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const contentPlanning: PipelineStep<
  ContentPlanningInput,
  ContentPlanningOutput
> = {
  stepName: "content-planning",
  inputSchema: inputSchema as unknown as z.ZodSchema<ContentPlanningInput>,
  outputSchema,
  execute,
};

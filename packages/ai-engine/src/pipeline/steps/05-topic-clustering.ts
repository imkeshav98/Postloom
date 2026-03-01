import { z } from "zod";
import { prisma } from "@autoblog/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildTopicClusteringPrompt,
  topicClusteringSchema,
} from "../../config/prompts/topic-clustering.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { ContentPlanningOutput } from "./04-content-planning.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  title: z.string(),
  keyword: z.string(),
  contentPlanId: z.string(),
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
  categoryId: z.string(),
  categoryName: z.string(),
  categorySlug: z.string(),
  isPillar: z.boolean(),
  clusterGroup: z.string(),
});

export type TopicClusteringInput = ContentPlanningOutput;
export type TopicClusteringOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AITopicClusterResponse {
  categoryName: string;
  categorySlug: string;
  isNewCategory: boolean;
  isPillar: boolean;
  clusterGroup: string;
  reasoning: string;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: TopicClusteringInput,
  context: StepContext,
): Promise<TopicClusteringOutput> {
  const config = await getModelConfig(context.blogId);

  // Fetch existing categories with post counts
  const categories = await prisma.category.findMany({
    where: { blogId: context.blogId },
    include: { _count: { select: { posts: true } } },
  });

  const existingCategories = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    isPillar: c.isPillar,
    postCount: c._count.posts,
  }));

  const result = await chatJSON<AITopicClusterResponse>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      {
        role: "user",
        content: buildTopicClusteringPrompt(
          input.niche,
          input.title,
          input.keyword,
          existingCategories,
        ),
      },
    ],
    jsonSchema: topicClusteringSchema,
  });

  // Create or find category — retry-safe for concurrent inserts
  let category;
  try {
    category = await prisma.category.upsert({
      where: {
        blogId_slug: { blogId: context.blogId, slug: result.categorySlug },
      },
      update: {},
      create: {
        blogId: context.blogId,
        name: result.categoryName,
        slug: result.categorySlug,
        isPillar: result.isPillar,
      },
    });
  } catch {
    // Race condition: another job created it between our check and insert
    const existing = await prisma.category.findUnique({
      where: {
        blogId_slug: { blogId: context.blogId, slug: result.categorySlug },
      },
    });
    if (!existing) throw new Error(`Category "${result.categorySlug}" not found after upsert failure`);
    category = existing;
  }

  if (result.isNewCategory) {
    console.log(`    [Topic Clustering] Created/found category: "${category.name}"`);
  } else {
    console.log(`    [Topic Clustering] Assigned to existing category: "${category.name}"`);
  }

  // Update ContentPlan with cluster info
  await prisma.contentPlan.update({
    where: { id: input.contentPlanId },
    data: {
      clusterGroup: result.clusterGroup,
      isHub: result.isPillar,
    },
  });

  return {
    ...input,
    categoryId: category.id,
    categoryName: result.categoryName,
    categorySlug: result.categorySlug,
    isPillar: result.isPillar,
    clusterGroup: result.clusterGroup,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const topicClustering: PipelineStep<
  TopicClusteringInput,
  TopicClusteringOutput
> = {
  stepName: "topic-clustering",
  inputSchema: inputSchema as unknown as z.ZodSchema<TopicClusteringInput>,
  outputSchema,
  execute,
};

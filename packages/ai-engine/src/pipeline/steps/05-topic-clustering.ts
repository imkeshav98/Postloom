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

  if (categories.length === 0) {
    throw new Error(
      `No categories exist for blog ${context.blogId}. ` +
      `Run the SETUP pipeline first to create categories before generating posts.`,
    );
  }

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

  // Look up existing category — SETUP pipeline must have created categories first
  const category = await prisma.category.findUnique({
    where: {
      blogId_slug: { blogId: context.blogId, slug: result.categorySlug },
    },
  });

  if (!category) {
    throw new Error(
      `AI selected category "${result.categorySlug}" which does not exist. ` +
      `Available categories: [${existingCategories.map((c) => c.slug).join(", ")}].`,
    );
  }

  console.log(`    [Topic Clustering] Assigned to category: "${category.name}"`);

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

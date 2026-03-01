import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildSetupCategoriesPrompt,
  setupCategoriesSchema,
} from "../../config/prompts/setup-categories.js";
import type { PipelineStep, StepContext } from "../types.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  categoryIds: z.array(z.string()),
});

export type SetupCategoriesInput = z.infer<typeof inputSchema>;
export type SetupCategoriesOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AICategoriesResponse {
  categories: Array<{
    name: string;
    slug: string;
    description: string;
    isPillar: boolean;
    parentSlug: string | null;
  }>;
  reasoning: string;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: SetupCategoriesInput,
  context: StepContext,
): Promise<SetupCategoriesOutput> {
  // If categories already exist, skip AI generation (idempotent re-runs)
  const existing = await prisma.category.findMany({
    where: { blogId: context.blogId },
    select: { id: true },
  });

  if (existing.length > 0) {
    console.log(`    [Setup Categories] ${existing.length} categories already exist, skipping`);
    return {
      niche: input.niche,
      categoriesCreated: existing.length,
      categoryIds: existing.map((c) => c.id),
    };
  }

  const config = await getModelConfig(context.blogId);

  // Fetch blog info
  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: context.blogId },
    select: { name: true, description: true },
  });

  const result = await chatJSON<AICategoriesResponse>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      {
        role: "user",
        content: buildSetupCategoriesPrompt(
          input.niche,
          blog.name,
          blog.description,
        ),
      },
    ],
    jsonSchema: setupCategoriesSchema,
  });

  console.log(`    [Setup Categories] AI suggested ${result.categories.length} categories: ${result.categories.map((c) => c.name).join(", ")}`);

  // Pass 1: Upsert all categories (without parent relationships)
  const categoryMap = new Map<string, string>(); // slug -> id

  for (const cat of result.categories) {
    const category = await prisma.category.upsert({
      where: {
        blogId_slug: { blogId: context.blogId, slug: cat.slug },
      },
      update: {
        name: cat.name,
        description: cat.description,
        isPillar: cat.isPillar,
      },
      create: {
        blogId: context.blogId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isPillar: cat.isPillar,
      },
    });
    categoryMap.set(cat.slug, category.id);
  }

  // Pass 2: Set parent relationships for hierarchical categories
  for (const cat of result.categories) {
    if (cat.parentSlug && categoryMap.has(cat.parentSlug)) {
      const childId = categoryMap.get(cat.slug)!;
      const parentId = categoryMap.get(cat.parentSlug)!;
      await prisma.category.update({
        where: { id: childId },
        data: { parentId },
      });
    }
  }

  const categoryIds = Array.from(categoryMap.values());
  console.log(`    [Setup Categories] Created/updated ${categoryIds.length} categories`);

  return {
    niche: input.niche,
    categoriesCreated: categoryIds.length,
    categoryIds,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const setupCategories: PipelineStep<
  SetupCategoriesInput,
  SetupCategoriesOutput
> = {
  stepName: "setup-categories",
  inputSchema: inputSchema as unknown as z.ZodSchema<SetupCategoriesInput>,
  outputSchema,
  execute,
};

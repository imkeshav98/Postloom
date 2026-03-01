import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildSetupSeoPrompt,
  setupSeoSchema,
} from "../../config/prompts/setup-seo.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { SetupImagesOutput } from "./setup-03-images.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  categoryIds: z.array(z.string()),
  pagesCreated: z.number(),
  pageSlugs: z.array(z.string()),
  logoUrl: z.string(),
  faviconUrl: z.string(),
  ogImageUrl: z.string(),
  heroImageUrl: z.string(),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  pagesCreated: z.number(),
  imagesGenerated: z.number(),
  metaDescription: z.string(),
  siteKeywords: z.array(z.string()),
  setupComplete: z.literal(true),
});

export type SetupSeoInput = SetupImagesOutput;
export type SetupSeoOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AISiteSeoResponse {
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  refinedDescription: string;
  siteKeywords: string[];
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: SetupSeoInput,
  context: StepContext,
): Promise<SetupSeoOutput> {
  const config = await getModelConfig(context.blogId);

  // Fetch blog info and categories
  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: context.blogId },
    select: { name: true, description: true },
  });

  const categories = await prisma.category.findMany({
    where: { blogId: context.blogId },
    select: { name: true },
  });

  const result = await chatJSON<AISiteSeoResponse>({
    model: config.seoOptimization.model,
    temperature: config.seoOptimization.temperature,
    maxTokens: config.seoOptimization.maxTokens,
    messages: [
      {
        role: "user",
        content: buildSetupSeoPrompt(
          input.niche,
          blog.name,
          blog.description,
          categories.map((c) => c.name),
        ),
      },
    ],
    jsonSchema: setupSeoSchema,
  });

  console.log(`    [Setup SEO] Meta description: "${result.metaDescription}"`);
  console.log(`    [Setup SEO] Site keywords: ${result.siteKeywords.join(", ")}`);

  // Update Blog description if current one is null or too short
  if (!blog.description || blog.description.length < 50) {
    await prisma.blog.update({
      where: { id: context.blogId },
      data: { description: result.refinedDescription },
    });
    console.log(`    [Setup SEO] Updated blog description to: "${result.refinedDescription}"`);
  }

  // Store SEO config in SiteConfig
  await prisma.siteConfig.update({
    where: { blogId: context.blogId },
    data: {
      seoConfig: {
        metaDescription: result.metaDescription,
        ogTitle: result.ogTitle,
        ogDescription: result.ogDescription,
        siteKeywords: result.siteKeywords,
      },
    },
  });

  console.log(`    [Setup SEO] Site SEO configuration stored`);

  return {
    niche: input.niche,
    categoriesCreated: input.categoriesCreated,
    pagesCreated: input.pagesCreated,
    imagesGenerated: 4,
    metaDescription: result.metaDescription,
    siteKeywords: result.siteKeywords,
    setupComplete: true,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const setupSeo: PipelineStep<
  SetupSeoInput,
  SetupSeoOutput
> = {
  stepName: "setup-seo",
  inputSchema: inputSchema as unknown as z.ZodSchema<SetupSeoInput>,
  outputSchema,
  execute,
};

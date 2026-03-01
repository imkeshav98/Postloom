import { z } from "zod";
import { prisma } from "@autoblog/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildSeoOptimizationPrompt,
  seoOptimizationSchema,
} from "../../config/prompts/seo-optimization.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { InternalLinkingOutput } from "./08-internal-linking.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  title: z.string(),
  keyword: z.string(),
  postId: z.string(),
  contentMarkdown: z.string(),
  excerpt: z.string(),
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
});

export type SeoOptimizationInput = InternalLinkingOutput;
export type SeoOptimizationOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AISeoResponse {
  metaTitle: string;
  metaDescription: string;
  secondaryKeywords: string[];
  readingTime: number;
  seoScore: number;
  suggestions: string[];
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: SeoOptimizationInput,
  context: StepContext,
): Promise<SeoOptimizationOutput> {
  const config = await getModelConfig(context.blogId);

  const result = await chatJSON<AISeoResponse>({
    model: config.seoOptimization.model,
    temperature: config.seoOptimization.temperature,
    maxTokens: config.seoOptimization.maxTokens,
    messages: [
      {
        role: "user",
        content: buildSeoOptimizationPrompt(
          input.title,
          input.keyword,
          input.contentMarkdown,
          input.excerpt,
        ),
      },
    ],
    jsonSchema: seoOptimizationSchema,
  });

  // Update the Post with SEO metadata
  await prisma.post.update({
    where: { id: input.postId },
    data: {
      metaTitle: result.metaTitle,
      metaDescription: result.metaDescription,
      secondaryKeywords: result.secondaryKeywords,
      readingTime: result.readingTime,
    },
  });

  console.log(`    [SEO Optimization] Score: ${result.seoScore}/100 — Updated post SEO metadata`);

  if (result.suggestions.length > 0) {
    console.log(`    [SEO Optimization] Suggestions:`);
    result.suggestions.forEach((s) => console.log(`      - ${s}`));
  }

  return {
    niche: input.niche,
    postId: input.postId,
    title: input.title,
    slug: input.slug,
    keyword: input.keyword,
    categoryName: input.categoryName,
    wordCount: input.wordCount,
    imageUrl: input.imageUrl,
    linksCreated: input.linksCreated,
    metaTitle: result.metaTitle,
    metaDescription: result.metaDescription,
    secondaryKeywords: result.secondaryKeywords,
    readingTime: result.readingTime,
    seoScore: result.seoScore,
    suggestions: result.suggestions,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const seoOptimization: PipelineStep<
  SeoOptimizationInput,
  SeoOptimizationOutput
> = {
  stepName: "seo-optimization",
  inputSchema: inputSchema as unknown as z.ZodSchema<SeoOptimizationInput>,
  outputSchema,
  execute,
};

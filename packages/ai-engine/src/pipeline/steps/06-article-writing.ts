import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildArticleWritingPrompt,
  articleWritingSchema,
} from "../../config/prompts/article-writing.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { TopicClusteringOutput } from "./05-topic-clustering.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  title: z.string(),
  slug: z.string(),
  keyword: z.string(),
  categoryId: z.string(),
  outline: z.array(z.object({
    heading: z.string(),
    level: z.number(),
    description: z.string(),
  })),
  targetWordCount: z.number(),
  contentType: z.string(),
  uniqueAngle: z.string(),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  keywordId: z.string(),
  keyword: z.string(),
  contentPlanId: z.string(),
  title: z.string(),
  slug: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  categorySlug: z.string(),
  isPillar: z.boolean(),
  clusterGroup: z.string(),
  postId: z.string(),
  contentMarkdown: z.string(),
  excerpt: z.string(),
  wordCount: z.number(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  imagePrompt: z.string(),
});

export type ArticleWritingInput = TopicClusteringOutput;
export type ArticleWritingOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AIArticleResponse {
  contentMarkdown: string;
  excerpt: string;
  faq: Array<{ question: string; answer: string }>;
  wordCount: number;
  imagePrompt: string;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: ArticleWritingInput,
  context: StepContext,
): Promise<ArticleWritingOutput> {
  const config = await getModelConfig(context.blogId);

  const result = await chatJSON<AIArticleResponse>({
    model: config.writing.model,
    temperature: config.writing.temperature,
    maxTokens: config.writing.maxTokens,
    messages: [
      {
        role: "user",
        content: buildArticleWritingPrompt(
          input.niche,
          input.title,
          input.keyword,
          input.outline,
          input.targetWordCount,
          input.contentType,
          input.uniqueAngle,
        ),
      },
    ],
    jsonSchema: articleWritingSchema,
    webSearch: {
      enabled: true,
      searchPrompt: `${input.keyword} latest research facts statistics 2025 2026`,
      maxResults: 10,
    },
    reasoning: { effort: "medium" },
  });

  // Upsert Post as DRAFT — prevents duplicates if step reruns on retry
  const post = await prisma.post.upsert({
    where: {
      blogId_slug: { blogId: context.blogId, slug: input.slug },
    },
    update: {
      contentMarkdown: result.contentMarkdown,
      excerpt: result.excerpt,
      wordCount: result.wordCount,
      faqData: result.faq,
    },
    create: {
      blogId: context.blogId,
      title: input.title,
      slug: input.slug,
      contentMarkdown: result.contentMarkdown,
      excerpt: result.excerpt,
      focusKeyword: input.keyword,
      wordCount: result.wordCount,
      faqData: result.faq,
      categoryId: input.categoryId,
      status: "DRAFT",
      aiGenerated: true,
      aiModel: config.writing.model,
    },
  });

  // Update ContentPlan status
  await prisma.contentPlan.update({
    where: { id: input.contentPlanId },
    data: { status: "COMPLETED" },
  });

  console.log(`    [Article Writing] Created post: "${input.title}" (${result.wordCount} words)`);

  return {
    niche: input.niche,
    keywordId: input.keywordId,
    keyword: input.keyword,
    contentPlanId: input.contentPlanId,
    title: input.title,
    slug: input.slug,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    categorySlug: input.categorySlug,
    isPillar: input.isPillar,
    clusterGroup: input.clusterGroup,
    postId: post.id,
    contentMarkdown: result.contentMarkdown,
    excerpt: result.excerpt,
    wordCount: result.wordCount,
    faq: result.faq,
    imagePrompt: result.imagePrompt,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const articleWriting: PipelineStep<
  ArticleWritingInput,
  ArticleWritingOutput
> = {
  stepName: "article-writing",
  inputSchema: inputSchema as unknown as z.ZodSchema<ArticleWritingInput>,
  outputSchema,
  execute,
};

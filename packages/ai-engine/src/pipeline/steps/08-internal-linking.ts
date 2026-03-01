import { z } from "zod";
import { prisma } from "@autoblog/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildInternalLinkingPrompt,
  internalLinkingSchema,
} from "../../config/prompts/internal-linking.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { ImageGenerationOutput } from "./07-image-generation.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  title: z.string(),
  postId: z.string(),
  contentMarkdown: z.string(),
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
  imageId: z.string(),
  imageUrl: z.string(),
  linksCreated: z.number(),
});

export type InternalLinkingInput = ImageGenerationOutput;
export type InternalLinkingOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AIInternalLinkResponse {
  links: Array<{
    targetPostId: string;
    anchorText: string;
    context: string;
    reasoning: string;
  }>;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: InternalLinkingInput,
  context: StepContext,
): Promise<InternalLinkingOutput> {
  const config = await getModelConfig(context.blogId);

  // Get other published/draft posts for linking candidates
  const existingPosts = await prisma.post.findMany({
    where: {
      blogId: context.blogId,
      id: { not: input.postId },
      status: { in: ["PUBLISHED", "DRAFT"] },
    },
    select: { id: true, title: true, slug: true, excerpt: true },
    take: 50,
  });

  let linksCreated = 0;

  if (existingPosts.length > 0) {
    const result = await chatJSON<AIInternalLinkResponse>({
      model: config.internalLinking.model,
      temperature: config.internalLinking.temperature,
      maxTokens: config.internalLinking.maxTokens,
      messages: [
        {
          role: "user",
          content: buildInternalLinkingPrompt(
            input.title,
            input.contentMarkdown,
            existingPosts,
          ),
        },
      ],
      jsonSchema: internalLinkingSchema,
    });

    // Validate and create internal links
    const validPostIds = new Set(existingPosts.map((p) => p.id));

    for (const link of result.links) {
      // Only create links to posts that actually exist
      if (!validPostIds.has(link.targetPostId)) continue;

      try {
        await prisma.internalLink.create({
          data: {
            sourcePostId: input.postId,
            targetPostId: link.targetPostId,
            anchorText: link.anchorText,
            context: link.context,
          },
        });
        linksCreated++;
      } catch {
        // Skip duplicate links (@@unique constraint)
      }
    }
  }

  console.log(`    [Internal Linking] Created ${linksCreated} internal link(s)`);

  return {
    ...input,
    linksCreated,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const internalLinking: PipelineStep<
  InternalLinkingInput,
  InternalLinkingOutput
> = {
  stepName: "internal-linking",
  inputSchema: inputSchema as unknown as z.ZodSchema<InternalLinkingInput>,
  outputSchema,
  execute,
};

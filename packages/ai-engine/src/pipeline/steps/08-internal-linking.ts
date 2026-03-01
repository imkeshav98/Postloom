import { z } from "zod";
import { prisma } from "@postloom/database";
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
  slug: z.string(),
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
  forwardLinks: Array<{
    targetPostId: string;
    anchorText: string;
    searchPhrase: string;
  }>;
  reverseLinks: Array<{
    sourcePostId: string;
    anchorText: string;
  }>;
}

// ─── Helper: inject a markdown link near a search phrase ─────────────────────

function injectLink(
  content: string,
  searchPhrase: string,
  anchorText: string,
  slug: string,
): string {
  const idx = content.toLowerCase().indexOf(searchPhrase.toLowerCase());
  if (idx === -1) return content;

  // Don't inject if there's already a markdown link nearby
  const region = content.slice(Math.max(0, idx - 50), idx + searchPhrase.length + 50);
  if (region.includes("](")) return content;

  const end = idx + searchPhrase.length;
  const link = ` [${anchorText}](/${slug})`;
  return content.slice(0, end) + link + content.slice(end);
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
    select: { id: true, title: true, slug: true, excerpt: true, contentMarkdown: true },
    take: 50,
  });

  let linksCreated = 0;
  let updatedContent = input.contentMarkdown;

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
            input.slug,
            input.contentMarkdown,
            existingPosts,
          ),
        },
      ],
      jsonSchema: internalLinkingSchema,
    });

    const validPostIds = new Set(existingPosts.map((p) => p.id));
    const postSlugMap = new Map(existingPosts.map((p) => [p.id, p.slug]));

    // ── Forward links: new post → old posts ──────────────────────────────
    for (const link of result.forwardLinks) {
      if (!validPostIds.has(link.targetPostId)) continue;

      const targetSlug = postSlugMap.get(link.targetPostId)!;
      const before = updatedContent;
      updatedContent = injectLink(updatedContent, link.searchPhrase, link.anchorText, targetSlug);
      const injected = updatedContent !== before;

      try {
        await prisma.internalLink.create({
          data: {
            sourcePostId: input.postId,
            targetPostId: link.targetPostId,
            anchorText: link.anchorText,
            context: link.searchPhrase,
          },
        });
        linksCreated++;
        if (injected) {
          console.log(`    [Internal Linking] Forward: linked to "/${targetSlug}" with anchor "${link.anchorText}"`);
        }
      } catch {
        // Skip duplicate links (@@unique constraint)
      }
    }

    // Save updated content for the new post if any forward links were injected
    if (updatedContent !== input.contentMarkdown) {
      await prisma.post.update({
        where: { id: input.postId },
        data: { contentMarkdown: updatedContent },
      });
    }

    // ── Reverse links: old posts → new post ──────────────────────────────
    for (const link of result.reverseLinks) {
      if (!validPostIds.has(link.sourcePostId)) continue;

      const sourcePost = existingPosts.find((p) => p.id === link.sourcePostId);
      if (!sourcePost?.contentMarkdown) continue;

      // Skip if this old post already links to the new post
      if (sourcePost.contentMarkdown.includes(`](/${input.slug})`)) continue;

      const linkMarkdown = `\n\nYou might also enjoy our guide on [${link.anchorText}](/${input.slug}).`;

      try {
        await prisma.internalLink.create({
          data: {
            sourcePostId: link.sourcePostId,
            targetPostId: input.postId,
            anchorText: link.anchorText,
            context: "reverse-link",
          },
        });

        await prisma.post.update({
          where: { id: link.sourcePostId },
          data: {
            contentMarkdown: sourcePost.contentMarkdown + linkMarkdown,
          },
        });

        linksCreated++;
        console.log(`    [Internal Linking] Reverse: "${sourcePost.slug}" now links to "/${input.slug}"`);
      } catch {
        // Skip duplicate links
      }
    }
  }

  console.log(`    [Internal Linking] Created ${linksCreated} internal link(s) total`);

  return {
    ...input,
    contentMarkdown: updatedContent,
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

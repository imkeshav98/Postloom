import { z } from "zod";
import { prisma } from "@postloom/database";
import type { PipelineStep, StepContext } from "../types.js";
import type { SeoOptimizationOutput } from "./09-seo-optimization.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  postId: z.string(),
  slug: z.string(),
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
});

export type PublishingInput = SeoOptimizationOutput;
export type PublishingOutput = z.infer<typeof outputSchema>;

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: PublishingInput,
  context: StepContext,
): Promise<PublishingOutput> {
  const now = new Date();

  // Publish the post
  await prisma.post.update({
    where: { id: input.postId },
    data: {
      status: "PUBLISHED",
      publishedAt: now,
    },
  });

  console.log(`    [Publishing] Post published: ${input.slug}`);

  // Call revalidation webhook if blog has a domain configured
  const blog = await prisma.blog.findUnique({
    where: { id: context.blogId },
    select: { domain: true },
  });

  const secret = process.env.REVALIDATION_SECRET;

  if (blog?.domain && secret) {
    const url = `https://${blog.domain}/api/revalidate?secret=${encodeURIComponent(secret)}&tag=${encodeURIComponent(input.slug)}`;
    try {
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        console.log(`    [Publishing] Revalidation webhook sent to ${blog.domain}`);
      } else {
        console.warn(`    [Publishing] Revalidation webhook returned ${res.status} — cache may be stale`);
      }
    } catch (err) {
      console.warn(`    [Publishing] Revalidation webhook failed (${blog.domain}) — blog may not be deployed yet`);
    }
  } else {
    console.log(`    [Publishing] No domain/secret configured — skipping revalidation webhook`);
  }

  return {
    ...input,
    publishedAt: now.toISOString(),
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const publishing: PipelineStep<
  PublishingInput,
  PublishingOutput
> = {
  stepName: "publishing",
  inputSchema: inputSchema as unknown as z.ZodSchema<PublishingInput>,
  outputSchema,
  execute,
};

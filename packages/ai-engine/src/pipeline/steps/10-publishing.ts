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

  // Revalidate blog cache so the new post appears immediately
  const secret = process.env.REVALIDATION_SECRET;

  if (secret) {
    const blogHosts = (process.env.BLOG_HOSTS || "blog:3000").split(",");
    const tags = ["posts", "blog-config"];
    await Promise.allSettled(
      blogHosts.flatMap((host) =>
        tags.map((tag) =>
          fetch(`http://${host.trim()}/api/revalidate?secret=${secret}&tag=${tag}`, { method: "POST" })
        )
      )
    );
    console.log(`    [Publishing] Revalidation sent to ${blogHosts.length} blog host(s)`);
  } else {
    console.log(`    [Publishing] No REVALIDATION_SECRET — skipping cache revalidation`);
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

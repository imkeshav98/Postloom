import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  getPageSpecs,
  buildSinglePagePrompt,
  singlePageSchema,
} from "../../config/prompts/setup-pages.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { SetupCategoriesOutput } from "./setup-01-categories.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  categoryIds: z.array(z.string()),
}).passthrough();

const outputSchema = z.object({
  niche: z.string(),
  categoriesCreated: z.number(),
  categoryIds: z.array(z.string()),
  pagesCreated: z.number(),
  pageSlugs: z.array(z.string()),
});

export type SetupPagesInput = SetupCategoriesOutput;
export type SetupPagesOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AISinglePageResponse {
  title: string;
  contentMarkdown: string;
  metaTitle: string;
  metaDescription: string;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: SetupPagesInput,
  context: StepContext,
): Promise<SetupPagesOutput> {
  const config = await getModelConfig(context.blogId);

  // Fetch blog info
  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: context.blogId },
    select: { name: true, description: true, defaultAuthor: true, domain: true },
  });

  const specs = getPageSpecs(input.niche, blog.domain);
  const pageSlugs: string[] = [];

  const MIN_CONTENT_LENGTH: Record<string, number> = {
    "about": 500,
    "privacy-policy": 1500,
    "terms-of-service": 1000,
    "disclaimer": 500,
    "contact": 300,
  };

  for (const spec of specs) {
    console.log(`    [Setup Pages] Generating "${spec.slug}"...`);

    let result: AISinglePageResponse | null = null;
    const maxAttempts = 3;
    const minLen = MIN_CONTENT_LENGTH[spec.slug] ?? 200;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const candidate = await chatJSON<AISinglePageResponse>({
        model: config.writing.model,
        temperature: config.writing.temperature,
        maxTokens: 8192,
        messages: [
          {
            role: "user",
            content: buildSinglePagePrompt(
              spec,
              input.niche,
              blog.name,
              blog.description,
              blog.defaultAuthor,
              blog.domain,
            ),
          },
        ],
        jsonSchema: singlePageSchema,
      });

      if (candidate.contentMarkdown.length >= minLen) {
        result = candidate;
        break;
      }

      console.log(`    [Setup Pages] "${spec.slug}" too short (${candidate.contentMarkdown.length} chars < ${minLen}), retrying (${attempt}/${maxAttempts})...`);
    }

    if (!result) {
      throw new Error(`Failed to generate "${spec.slug}" with sufficient content after ${maxAttempts} attempts`);
    }

    await prisma.page.upsert({
      where: {
        blogId_slug: { blogId: context.blogId, slug: spec.slug },
      },
      update: {
        title: result.title,
        contentMarkdown: result.contentMarkdown,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
      },
      create: {
        blogId: context.blogId,
        title: result.title,
        slug: spec.slug,
        contentMarkdown: result.contentMarkdown,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
      },
    });

    pageSlugs.push(spec.slug);
    console.log(`    [Setup Pages] ✓ "${spec.slug}" (${result.contentMarkdown.length} chars)`);
  }

  console.log(`    [Setup Pages] Created/updated ${pageSlugs.length} pages`);

  return {
    ...input,
    pagesCreated: pageSlugs.length,
    pageSlugs,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const setupPages: PipelineStep<
  SetupPagesInput,
  SetupPagesOutput
> = {
  stepName: "setup-pages",
  inputSchema: inputSchema as unknown as z.ZodSchema<SetupPagesInput>,
  outputSchema,
  execute,
};

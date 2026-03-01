import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildKeywordResearchPrompt,
  keywordResearchSchema,
} from "../../config/prompts/keyword-research.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { NicheAnalysisOutput } from "./01-niche-analysis.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  nicheProfile: z.object({
    description: z.string(),
    marketSize: z.string(),
    monetizationPotential: z.string(),
  }),
  contentGaps: z.array(z.object({ topic: z.string(), opportunity: z.string() })),
  recommendedTopics: z.array(z.string()),
}).passthrough();

const keywordSchema = z.object({
  keyword: z.string(),
  searchVolume: z.number(),
  difficulty: z.number(),
  cpc: z.number(),
  intent: z.enum(["INFORMATIONAL", "NAVIGATIONAL", "TRANSACTIONAL", "COMMERCIAL"]),
});

const outputSchema = z.object({
  niche: z.string(),
  keywords: z.array(keywordSchema),
  keywordsSaved: z.number(),
});

export type KeywordResearchInput = NicheAnalysisOutput;
export type KeywordResearchOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AIKeywordResponse {
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    cpc: number;
    intent: "INFORMATIONAL" | "NAVIGATIONAL" | "TRANSACTIONAL" | "COMMERCIAL";
  }>;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: KeywordResearchInput,
  context: StepContext,
): Promise<KeywordResearchOutput> {
  const config = await getModelConfig(context.blogId);

  // Fetch existing keywords so the AI avoids duplicates/near-duplicates
  const existingKeywords = await prisma.keyword.findMany({
    where: { blogId: context.blogId },
    select: { keyword: true },
  });
  const existingKeywordList = existingKeywords.map((k) => k.keyword);

  const result = await chatJSON<AIKeywordResponse>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      {
        role: "user",
        content: buildKeywordResearchPrompt(
          input.niche,
          input.nicheProfile.description,
          input.contentGaps.map((g) => g.topic),
          input.recommendedTopics,
          existingKeywordList,
        ),
      },
    ],
    jsonSchema: keywordResearchSchema,
  });

  // Persist keywords to database (upsert using @@unique([blogId, keyword]))
  let saved = 0;
  for (const kw of result.keywords) {
    await prisma.keyword.upsert({
      where: {
        blogId_keyword: {
          blogId: context.blogId,
          keyword: kw.keyword,
        },
      },
      create: {
        blogId: context.blogId,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        difficulty: kw.difficulty,
        cpc: kw.cpc,
        intent: kw.intent,
        lastResearched: new Date(),
      },
      update: {
        searchVolume: kw.searchVolume,
        difficulty: kw.difficulty,
        cpc: kw.cpc,
        intent: kw.intent,
        lastResearched: new Date(),
      },
    });
    saved++;
  }

  console.log(`    [Keyword Research] Saved ${saved} keywords to database`);

  return {
    niche: input.niche,
    keywords: result.keywords,
    keywordsSaved: saved,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const keywordResearch: PipelineStep<
  KeywordResearchInput,
  KeywordResearchOutput
> = {
  stepName: "keyword-research",
  inputSchema: inputSchema as unknown as z.ZodSchema<KeywordResearchInput>,
  outputSchema,
  execute,
};

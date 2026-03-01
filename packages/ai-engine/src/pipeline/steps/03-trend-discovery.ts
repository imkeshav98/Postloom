import { z } from "zod";
import { prisma } from "@postloom/database";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildTrendDiscoveryPrompt,
  trendDiscoverySchema,
} from "../../config/prompts/trend-discovery.js";
import type { PipelineStep, StepContext } from "../types.js";
import type { KeywordResearchOutput } from "./02-keyword-research.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
  keywords: z.array(z.object({ keyword: z.string() }).passthrough()),
}).passthrough();

const trendSchema = z.object({
  topic: z.string(),
  trendScore: z.number(),
  description: z.string(),
  relatedKeywords: z.array(z.string()),
  suggestedKeywords: z.array(z.string()),
});

const outputSchema = z.object({
  niche: z.string(),
  trends: z.array(trendSchema),
  keywordsUpdated: z.number(),
});

export type TrendDiscoveryInput = KeywordResearchOutput;
export type TrendDiscoveryOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AITrendResponse {
  trends: Array<{
    topic: string;
    trendScore: number;
    description: string;
    relatedKeywords: string[];
    suggestedKeywords: string[];
  }>;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: TrendDiscoveryInput,
  context: StepContext,
): Promise<TrendDiscoveryOutput> {
  const config = await getModelConfig(context.blogId);

  const existingKeywords = input.keywords.map((k) => k.keyword);

  const result = await chatJSON<AITrendResponse>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      {
        role: "user",
        content: buildTrendDiscoveryPrompt(input.niche, existingKeywords),
      },
    ],
    jsonSchema: trendDiscoverySchema,
  });

  // Update trendScore and trendData for keywords that match trends
  let updated = 0;
  for (const trend of result.trends) {
    for (const relatedKw of trend.relatedKeywords) {
      // Find keyword in DB (case-insensitive match)
      const keyword = await prisma.keyword.findFirst({
        where: {
          blogId: context.blogId,
          keyword: { equals: relatedKw, mode: "insensitive" },
        },
      });

      if (keyword) {
        await prisma.keyword.update({
          where: { id: keyword.id },
          data: {
            trendScore: trend.trendScore,
            trendData: {
              topic: trend.topic,
              description: trend.description,
              score: trend.trendScore,
              discoveredAt: new Date().toISOString(),
            },
          },
        });
        updated++;
      }
    }
  }

  console.log(`    [Trend Discovery] Updated ${updated} keyword(s) with trend data`);

  return {
    niche: input.niche,
    trends: result.trends,
    keywordsUpdated: updated,
  };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const trendDiscovery: PipelineStep<
  TrendDiscoveryInput,
  TrendDiscoveryOutput
> = {
  stepName: "trend-discovery",
  inputSchema: inputSchema as unknown as z.ZodSchema<TrendDiscoveryInput>,
  outputSchema,
  execute,
};

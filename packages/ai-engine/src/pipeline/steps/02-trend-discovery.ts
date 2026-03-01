import { z } from "zod";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildTrendDiscoveryPrompt,
  trendDiscoverySchema,
} from "../../config/prompts/trend-discovery.js";
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

const trendSchema = z.object({
  topic: z.string(),
  trendScore: z.number(),
  description: z.string(),
  suggestedKeywords: z.array(z.string()),
});

const outputSchema = z.object({
  niche: z.string(),
  nicheProfile: z.object({
    description: z.string(),
    marketSize: z.string(),
    monetizationPotential: z.string(),
  }),
  contentGaps: z.array(z.object({ topic: z.string(), opportunity: z.string() })),
  recommendedTopics: z.array(z.string()),
  trends: z.array(trendSchema),
});

export type TrendDiscoveryInput = NicheAnalysisOutput;
export type TrendDiscoveryOutput = z.infer<typeof outputSchema>;

// ─── AI response type ───────────────────────────────────────────────────────

interface AITrendResponse {
  trends: Array<{
    topic: string;
    trendScore: number;
    description: string;
    suggestedKeywords: string[];
  }>;
}

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: TrendDiscoveryInput,
  context: StepContext,
): Promise<TrendDiscoveryOutput> {
  const config = await getModelConfig(context.blogId);

  const result = await chatJSON<AITrendResponse>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      {
        role: "user",
        content: buildTrendDiscoveryPrompt(
          input.niche,
          input.nicheProfile.description,
          input.contentGaps.map((g) => g.topic),
          input.recommendedTopics,
        ),
      },
    ],
    jsonSchema: trendDiscoverySchema,
    webSearch: {
      enabled: true,
      searchPrompt: `Trending ${input.niche} topics 2025 2026 viral popular emerging`,
      maxResults: 10,
    },
    reasoning: { effort: "medium" },
  });

  const totalSuggested = result.trends.reduce(
    (sum, t) => sum + t.suggestedKeywords.length, 0,
  );
  console.log(`    [Trend Discovery] Found ${result.trends.length} trends with ${totalSuggested} suggested keywords`);

  // Pass through niche data + add trends (purely analytical, no DB writes)
  return {
    niche: input.niche,
    nicheProfile: input.nicheProfile,
    contentGaps: input.contentGaps,
    recommendedTopics: input.recommendedTopics,
    trends: result.trends,
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

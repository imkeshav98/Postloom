import { z } from "zod";
import { chatJSON } from "../../client/openrouter.js";
import { getModelConfig } from "../../config/models.js";
import {
  buildNicheAnalysisPrompt,
  nicheAnalysisSchema,
} from "../../config/prompts/niche-analysis.js";
import type { PipelineStep, StepContext } from "../types.js";

// ─── Schemas ────────────────────────────────────────────────────────────────

const inputSchema = z.object({
  niche: z.string(),
});

const outputSchema = z.object({
  niche: z.string(),
  nicheProfile: z.object({
    description: z.string(),
    marketSize: z.string(),
    monetizationPotential: z.string(),
  }),
  targetAudience: z.object({
    ageRange: z.string(),
    interests: z.array(z.string()),
    painPoints: z.array(z.string()),
    searchBehavior: z.string(),
  }),
  competitors: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      strengths: z.string(),
      weaknesses: z.string(),
    }),
  ),
  contentGaps: z.array(
    z.object({
      topic: z.string(),
      opportunity: z.string(),
    }),
  ),
  recommendedTopics: z.array(z.string()),
  contentTypes: z.array(z.string()),
});

export type NicheAnalysisInput = z.infer<typeof inputSchema>;
export type NicheAnalysisOutput = z.infer<typeof outputSchema>;

// ─── Step implementation ────────────────────────────────────────────────────

async function execute(
  input: NicheAnalysisInput,
  context: StepContext,
): Promise<NicheAnalysisOutput> {
  const config = await getModelConfig(context.blogId);

  const result = await chatJSON<Omit<NicheAnalysisOutput, "niche">>({
    model: config.research.model,
    temperature: config.research.temperature,
    maxTokens: config.research.maxTokens,
    messages: [
      { role: "user", content: buildNicheAnalysisPrompt(input.niche) },
    ],
    jsonSchema: nicheAnalysisSchema,
  });

  // Carry niche forward for downstream steps
  return { niche: input.niche, ...result };
}

// ─── Export ─────────────────────────────────────────────────────────────────

export const nicheAnalysis: PipelineStep<
  NicheAnalysisInput,
  NicheAnalysisOutput
> = {
  stepName: "niche-analysis",
  inputSchema,
  outputSchema,
  execute,
};

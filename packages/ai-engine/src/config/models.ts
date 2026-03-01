import { prisma } from "@postloom/database";

// ─── Model config types ────────────────────────────────────────────────────

export interface ModelSettings {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelConfig {
  research: ModelSettings;
  writing: ModelSettings;
  imageGeneration: ModelSettings;
  seoOptimization: ModelSettings;
  internalLinking: ModelSettings;
}

// ─── Defaults (from PLAN.md) ────────────────────────────────────────────────

export const defaultModelConfig: ModelConfig = {
  research: {
    model: "x-ai/grok-4.1-fast",
    temperature: 0.3,
    maxTokens: 4096,
  },
  writing: {
    model: "anthropic/claude-sonnet-4.6",
    temperature: 0.7,
    maxTokens: 32768,
  },
  imageGeneration: {
    model: "bytedance-seed/seedream-4.5",
  },
  seoOptimization: {
    model: "x-ai/grok-4.1-fast",
    temperature: 0.2,
    maxTokens: 4096,
  },
  internalLinking: {
    model: "x-ai/grok-4.1-fast",
    temperature: 0.1,
    maxTokens: 2048,
  },
};

// ─── Per-blog config resolution ─────────────────────────────────────────────
// Blog.aiConfig can override any model settings. Example:
// { "research": { "model": "anthropic/claude-sonnet-4" } }

export async function getModelConfig(blogId: string): Promise<ModelConfig> {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    select: { aiConfig: true },
  });

  if (!blog?.aiConfig) return defaultModelConfig;

  const overrides = blog.aiConfig as Partial<ModelConfig>;

  return {
    research: { ...defaultModelConfig.research, ...overrides.research },
    writing: { ...defaultModelConfig.writing, ...overrides.writing },
    imageGeneration: { ...defaultModelConfig.imageGeneration, ...overrides.imageGeneration },
    seoOptimization: { ...defaultModelConfig.seoOptimization, ...overrides.seoOptimization },
    internalLinking: { ...defaultModelConfig.internalLinking, ...overrides.internalLinking },
  };
}

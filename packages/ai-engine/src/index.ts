// ─── Public API ─────────────────────────────────────────────────────────────

export { chat, chatJSON, generateImage } from "./client/openrouter.js";
export { defaultModelConfig, getModelConfig } from "./config/models.js";
export type { ModelConfig, ModelSettings } from "./config/models.js";
export type { PipelineStep, StepContext, RegisterStepFn } from "./pipeline/types.js";

// ─── Step implementations ───────────────────────────────────────────────────

import { nicheAnalysis } from "./pipeline/steps/01-niche-analysis.js";
import { keywordResearch } from "./pipeline/steps/02-keyword-research.js";
import { trendDiscovery } from "./pipeline/steps/03-trend-discovery.js";
import { contentPlanning } from "./pipeline/steps/04-content-planning.js";
import { topicClustering } from "./pipeline/steps/05-topic-clustering.js";
import { articleWriting } from "./pipeline/steps/06-article-writing.js";
import { imageGeneration } from "./pipeline/steps/07-image-generation.js";
import { internalLinking } from "./pipeline/steps/08-internal-linking.js";
import { seoOptimization } from "./pipeline/steps/09-seo-optimization.js";
import { publishing } from "./pipeline/steps/10-publishing.js";
import { performanceMonitoring } from "./pipeline/steps/11-performance-monitoring.js";

export { nicheAnalysis, keywordResearch, trendDiscovery };
export { contentPlanning, topicClustering, articleWriting, imageGeneration, internalLinking, seoOptimization };
export { publishing, performanceMonitoring };

// ─── Registration helpers ──────────────────────────────────────────────────
// Called by the worker to register pipeline steps.

import type { RegisterStepFn } from "./pipeline/types.js";

export function registerResearchSteps(registerStep: RegisterStepFn): void {
  registerStep(nicheAnalysis.stepName, (input, ctx) =>
    nicheAnalysis.execute(input as any, ctx),
  );
  registerStep(keywordResearch.stepName, (input, ctx) =>
    keywordResearch.execute(input as any, ctx),
  );
  registerStep(trendDiscovery.stepName, (input, ctx) =>
    trendDiscovery.execute(input as any, ctx),
  );
}

export function registerGenerationSteps(registerStep: RegisterStepFn): void {
  registerStep(contentPlanning.stepName, (input, ctx) =>
    contentPlanning.execute(input as any, ctx),
  );
  registerStep(topicClustering.stepName, (input, ctx) =>
    topicClustering.execute(input as any, ctx),
  );
  registerStep(articleWriting.stepName, (input, ctx) =>
    articleWriting.execute(input as any, ctx),
  );
  registerStep(imageGeneration.stepName, (input, ctx) =>
    imageGeneration.execute(input as any, ctx),
  );
  registerStep(internalLinking.stepName, (input, ctx) =>
    internalLinking.execute(input as any, ctx),
  );
  registerStep(seoOptimization.stepName, (input, ctx) =>
    seoOptimization.execute(input as any, ctx),
  );
}

export function registerPublishingSteps(registerStep: RegisterStepFn): void {
  registerStep(publishing.stepName, (input, ctx) =>
    publishing.execute(input as any, ctx),
  );
  registerStep(performanceMonitoring.stepName, (input, ctx) =>
    performanceMonitoring.execute(input as any, ctx),
  );
}

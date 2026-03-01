import { prisma } from "@autoblog/database";
import type { PipelineRun, PipelineRunType } from "@autoblog/database";

// ─── Step contract ──────────────────────────────────────────────────────────

export interface StepContext {
  runId: string;
  blogId: string;
}

export type StepFn = (
  input: unknown,
  context: StepContext,
) => Promise<unknown>;

// ─── Step registry ──────────────────────────────────────────────────────────
// Populated by ai-engine package in Phase 3+. Test steps can be registered
// directly for Phase 2 testing.

const stepRegistry = new Map<string, StepFn>();

export function registerStep(name: string, fn: StepFn): void {
  stepRegistry.set(name, fn);
}

// ─── Steps per pipeline type ────────────────────────────────────────────────
// Maps to the 11-step AI pipeline from the plan.

const PIPELINE_STEPS: Record<PipelineRunType, string[]> = {
  SETUP: [
    "setup-categories",
    "setup-pages",
    "setup-images",
    "setup-seo",
  ],
  RESEARCH: ["niche-analysis", "keyword-research", "trend-discovery"],
  GENERATE: [
    "content-planning",
    "topic-clustering",
    "article-writing",
    "image-generation",
    "internal-linking",
    "seo-optimization",
    "publishing",
    "performance-monitoring",
  ],
  BATCH: [
    "content-planning",
    "topic-clustering",
    "article-writing",
    "image-generation",
    "internal-linking",
    "seo-optimization",
    "publishing",
    "performance-monitoring",
  ],
  OPTIMIZE: ["seo-optimization", "internal-linking"],
};

// ─── Executor ───────────────────────────────────────────────────────────────

export async function executeRun(run: PipelineRun): Promise<unknown> {
  const steps = PIPELINE_STEPS[run.type] ?? [];

  // Load already-completed steps (for resume after failure)
  const existingSteps = await prisma.pipelineStepRun.findMany({
    where: { pipelineRunId: run.id },
    orderBy: { createdAt: "asc" },
  });

  const completedSteps = new Map(
    existingSteps
      .filter((s) => s.status === "SUCCEEDED")
      .map((s) => [s.stepName, s.output]),
  );

  // Clean up stale RUNNING step runs from crashed executions
  const staleStepIds = existingSteps
    .filter((s) => s.status === "RUNNING")
    .map((s) => s.id);
  if (staleStepIds.length > 0) {
    await prisma.pipelineStepRun.deleteMany({
      where: { id: { in: staleStepIds } },
    });
  }

  let lastOutput: unknown = run.input;

  for (const stepName of steps) {
    // Skip already-completed steps, but carry their output forward
    if (completedSteps.has(stepName)) {
      lastOutput = completedSteps.get(stepName) ?? lastOutput;
      continue;
    }

    const stepFn = stepRegistry.get(stepName);
    if (!stepFn) {
      console.log(`  [Step] "${stepName}" not registered, skipping`);
      continue;
    }

    // Create step record
    const stepRun = await prisma.pipelineStepRun.create({
      data: {
        pipelineRunId: run.id,
        stepName,
        status: "RUNNING",
        input: lastOutput as any,
      },
    });

    console.log(`  [Step] Running "${stepName}"...`);
    const startTime = Date.now();

    try {
      const output = await stepFn(lastOutput, {
        runId: run.id,
        blogId: run.blogId,
      });

      await prisma.pipelineStepRun.update({
        where: { id: stepRun.id },
        data: {
          status: "SUCCEEDED",
          output: output as any,
          durationMs: Date.now() - startTime,
        },
      });

      console.log(`  [Step] "${stepName}" succeeded (${Date.now() - startTime}ms)`);
      lastOutput = output;
    } catch (error) {
      const errorData = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };

      await prisma.pipelineStepRun.update({
        where: { id: stepRun.id },
        data: {
          status: "FAILED",
          error: errorData as any,
          durationMs: Date.now() - startTime,
        },
      });

      console.log(`  [Step] "${stepName}" failed: ${errorData.message}`);
      throw error; // Propagate to run-level handler in index.ts
    }
  }

  return lastOutput;
}

import { z } from "zod";

// ─── Step contract (from PLAN.md) ───────────────────────────────────────────
// Every pipeline step implements this interface.

export interface StepContext {
  runId: string;
  blogId: string;
}

export interface PipelineStep<TInput = unknown, TOutput = unknown> {
  stepName: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute(input: TInput, context: StepContext): Promise<TOutput>;
}

// ─── Step registration helper type ──────────────────────────────────────────

export type RegisterStepFn = (
  name: string,
  fn: (input: unknown, context: StepContext) => Promise<unknown>,
) => void;

// env.ts MUST be the first import — it loads .env before @postloom/database
// reads process.env.DATABASE_URL
import "./env.js";

import { prisma } from "@postloom/database";
import type { PipelineRun } from "@postloom/database";
import { executeRun, registerStep } from "./executor.js";
import { classifyError, calculateBackoff, shouldRetry } from "./retry.js";
import { registerResearchSteps, registerGenerationSteps, registerPublishingSteps, registerSetupSteps } from "@postloom/ai-engine";

// ─── Config ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5_000; // 5 seconds between polls
const STALE_LOCK_MS = 5 * 60 * 1_000; // 5 minutes = stale
const HEARTBEAT_INTERVAL_MS = 60_000; // Update lockedAt every 60 seconds

// ─── Register AI pipeline steps ─────────────────────────────────────────────

registerSetupSteps(registerStep);
registerResearchSteps(registerStep);
registerGenerationSteps(registerStep);
registerPublishingSteps(registerStep);

// ─── Claim a job ────────────────────────────────────────────────────────────
// Uses SELECT ... FOR UPDATE SKIP LOCKED to atomically claim one job.
// This prevents two workers from grabbing the same job.

async function claimJob(): Promise<PipelineRun | null> {
  return prisma.$transaction(async (tx) => {
    // Raw SQL for the locking query — Prisma doesn't support FOR UPDATE SKIP LOCKED
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "PipelineRun"
      WHERE status = 'QUEUED'
        AND ("scheduledAt" IS NULL OR "scheduledAt" <= NOW())
      ORDER BY priority DESC, "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) return null;

    // Update the claimed job to RUNNING
    const run = await tx.pipelineRun.update({
      where: { id: rows[0].id },
      data: {
        status: "RUNNING",
        lockedAt: new Date(),
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    return run;
  });
}

// ─── Reclaim stale jobs ─────────────────────────────────────────────────────
// If a worker crashes mid-job, lockedAt stops updating. After STALE_LOCK_MS,
// we reset those jobs back to QUEUED so another worker picks them up.

async function reclaimStaleJobs(): Promise<void> {
  const staleThreshold = new Date(Date.now() - STALE_LOCK_MS);

  const reclaimed = await prisma.pipelineRun.updateMany({
    where: {
      status: "RUNNING",
      lockedAt: { lt: staleThreshold },
    },
    data: {
      status: "QUEUED",
      lockedAt: null,
    },
  });

  if (reclaimed.count > 0) {
    console.log(`[Worker] Reclaimed ${reclaimed.count} stale job(s)`);
  }
}

// ─── Heartbeat ──────────────────────────────────────────────────────────────
// Periodically updates lockedAt to prove the worker is still alive.

function startHeartbeat(runId: string): () => void {
  const interval = setInterval(async () => {
    try {
      await prisma.pipelineRun.update({
        where: { id: runId },
        data: { lockedAt: new Date() },
      });
    } catch {
      // Run may have been cancelled or deleted
      clearInterval(interval);
    }
  }, HEARTBEAT_INTERVAL_MS);

  return () => clearInterval(interval);
}

// ─── Process a job ──────────────────────────────────────────────────────────

async function processJob(run: PipelineRun): Promise<void> {
  console.log(
    `[Worker] Processing run ${run.id} (type=${run.type}, attempt=${run.attempts})`,
  );

  const stopHeartbeat = startHeartbeat(run.id);

  try {
    const result = await executeRun(run);

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        result: (result as any) ?? {},
        finishedAt: new Date(),
        lockedAt: null,
      },
    });

    console.log(`[Worker] Run ${run.id} SUCCEEDED`);
  } catch (error) {
    const errorType = classifyError(error);
    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      type: errorType,
    };

    if (shouldRetry(run.attempts, run.maxAttempts, errorType)) {
      // Requeue with backoff — set scheduledAt in the future
      const backoffMs = calculateBackoff(run.attempts);
      const retryAt = new Date(Date.now() + backoffMs);

      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          status: "QUEUED",
          error: errorData as any,
          lockedAt: null,
          scheduledAt: retryAt,
        },
      });

      console.log(
        `[Worker] Run ${run.id} FAILED (transient), retry #${run.attempts} in ${backoffMs}ms`,
      );
    } else {
      // Permanent failure — no more retries
      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: errorData as any,
          finishedAt: new Date(),
          lockedAt: null,
        },
      });

      console.log(
        `[Worker] Run ${run.id} FAILED (${errorType}, attempt ${run.attempts}/${run.maxAttempts})`,
      );
    }
  } finally {
    stopHeartbeat();
  }
}

// ─── Polling loop ───────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log("[Worker] Starting...");
  console.log(`[Worker] Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`[Worker] Stale lock threshold: ${STALE_LOCK_MS}ms`);

  let running = true;

  // Graceful shutdown on SIGINT (Ctrl+C) and SIGTERM (Docker stop)
  const shutdown = () => {
    console.log("\n[Worker] Shutting down gracefully...");
    running = false;
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (running) {
    try {
      // Reclaim any jobs stuck from crashed workers
      await reclaimStaleJobs();

      // Try to claim a job
      const run = await claimJob();

      if (run) {
        await processJob(run);
      } else {
        // No jobs available, wait before polling again
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (error) {
      console.error("[Worker] Polling error:", error);
      await sleep(POLL_INTERVAL_MS);
    }
  }

  await prisma.$disconnect();
  console.log("[Worker] Stopped.");
}

main();

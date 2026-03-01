import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User } from "lucide-react";
import { AutoRefresh } from "../auto-refresh";
import { RetryButton } from "./retry-button";

const statusColors: Record<string, string> = {
  QUEUED: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  SUCCEEDED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  SKIPPED: "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400",
};

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const run = await prisma.pipelineRun.findUnique({
    where: { id },
    include: {
      blog: { select: { name: true, niche: true } },
      steps: { orderBy: { createdAt: "asc" } },
      requestedBy: { select: { email: true } },
    },
  });

  if (!run) notFound();

  const totalDuration =
    run.finishedAt && run.startedAt
      ? Math.round((run.finishedAt.getTime() - run.startedAt.getTime()) / 1000)
      : null;

  const isActive = run.status === "QUEUED" || run.status === "RUNNING";

  return (
    <div className="space-y-6">
      <AutoRefresh active={isActive} />
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Pipeline
      </Link>

      {/* Run header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-content">{run.type} Run</h2>
            <Badge
              variant="secondary"
              className={statusColors[run.status] ?? ""}
            >
              {run.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {run.blog.name} · {run.blog.niche}
          </p>
        </div>
        <div className="flex items-start gap-3">
          {run.status === "FAILED" && <RetryButton runId={run.id} />}
          <div className="space-y-1 text-right text-xs text-muted-foreground">
            <p>Created: {run.createdAt.toLocaleString()}</p>
            {run.startedAt && <p>Started: {run.startedAt.toLocaleString()}</p>}
            {run.finishedAt && <p>Finished: {run.finishedAt.toLocaleString()}</p>}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        {totalDuration !== null && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {totalDuration}s total
          </span>
        )}
        {run.requestedBy && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {run.requestedBy.email}
          </span>
        )}
        <span>Attempt {run.attempts}/{run.maxAttempts}</span>
      </div>

      {/* Error */}
      {run.error && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-surface-alt p-3 text-xs text-content">
              {JSON.stringify(run.error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Steps ({run.steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {run.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No steps recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {run.steps.map((step, idx) => (
                <details key={step.id} className="group rounded-lg border border-edge/60 dark:border-white/5">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-surface-alt">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-content">
                        {step.stepName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {step.durationMs != null && (
                        <span className="text-xs text-muted-foreground">
                          {(step.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={statusColors[step.status] ?? ""}
                      >
                        {step.status}
                      </Badge>
                    </div>
                  </summary>
                  <div className="border-t border-edge/60 px-4 py-3 space-y-2 dark:border-white/5">
                    {step.error && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-destructive">Error:</p>
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-surface-alt p-2 text-xs">
                          {JSON.stringify(step.error, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Output:</p>
                        <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-surface-alt p-2 text-xs">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {!step.error && !step.output && (
                      <p className="text-xs text-muted-foreground">No data recorded.</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input/Result */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-surface-alt p-3 text-xs">
              {JSON.stringify(run.input, null, 2)}
            </pre>
          </CardContent>
        </Card>
        {run.result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-surface-alt p-3 text-xs">
                {JSON.stringify(run.result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

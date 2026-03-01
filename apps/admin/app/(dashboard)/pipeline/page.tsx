import Link from "next/link";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow } from "lucide-react";
import { EnqueueButton } from "./enqueue-button";

const statusColors: Record<string, string> = {
  QUEUED: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  SUCCEEDED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

export default async function PipelinePage() {
  const user = await validateSession();
  if (!user) redirect("/login");

  const [runs, blogs] = await Promise.all([
    prisma.pipelineRun.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        blog: { select: { name: true } },
        _count: { select: { steps: true } },
      },
    }),
    prisma.blog.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-content">Pipeline Runs</h2>
          <p className="text-sm text-muted-foreground">{runs.length} runs</p>
        </div>
        <EnqueueButton blogs={blogs} />
      </div>

      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Workflow className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No pipeline runs yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-edge/60 dark:divide-white/5">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/pipeline/${run.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-alt"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={statusColors[run.status] ?? ""}
                    >
                      {run.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-content">
                        {run.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.blog.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{run._count.steps} steps</span>
                    {run.finishedAt && run.startedAt && (
                      <span>
                        {Math.round(
                          (run.finishedAt.getTime() - run.startedAt.getTime()) /
                            1000,
                        )}s
                      </span>
                    )}
                    <span>
                      {run.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

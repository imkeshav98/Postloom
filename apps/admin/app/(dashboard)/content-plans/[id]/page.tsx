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
import { ArrowLeft } from "lucide-react";
import { PlanActions } from "./plan-actions";

const statusColors: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  SKIPPED: "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400",
};

export default async function ContentPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const plan = await prisma.contentPlan.findUnique({
    where: { id },
    include: {
      blog: { select: { name: true } },
      targetKeyword: { select: { keyword: true, searchVolume: true, difficulty: true } },
    },
  });

  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/content-plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Content Plans
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-2xl font-bold text-content">{plan.title}</h2>
          <p className="text-sm text-muted-foreground">
            {plan.blog.name}
            {plan.clusterGroup && ` · ${plan.clusterGroup}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {plan.isHub && (
            <Badge variant="outline">Hub</Badge>
          )}
          <Badge
            variant="secondary"
            className={statusColors[plan.status] ?? ""}
          >
            {plan.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <PlanActions planId={plan.id} currentStatus={plan.status} currentPriority={plan.priority} />

      {/* Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Info</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Field label="Priority" value={String(plan.priority)} />
              <Field label="Cluster Group" value={plan.clusterGroup ?? "None"} />
              <Field label="Hub Page" value={plan.isHub ? "Yes" : "No"} />
              <Field label="Created" value={plan.createdAt.toLocaleString()} />
              <Field label="Updated" value={plan.updatedAt.toLocaleString()} />
            </dl>
          </CardContent>
        </Card>

        {plan.targetKeyword && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target Keyword</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <Field label="Keyword" value={plan.targetKeyword.keyword} />
                <Field label="Search Volume" value={plan.targetKeyword.searchVolume?.toLocaleString() ?? "N/A"} />
                <Field label="Difficulty" value={plan.targetKeyword.difficulty?.toString() ?? "N/A"} />
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Outline */}
      {plan.outline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-lg bg-surface-alt p-5">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-content">
                {JSON.stringify(plan.outline, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-content">{value}</dd>
    </div>
  );
}

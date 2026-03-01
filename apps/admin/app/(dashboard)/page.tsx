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
import { Button } from "@/components/ui/button";
import { Globe, FileText, Workflow, Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  QUEUED: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  RUNNING: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  SUCCEEDED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

export default async function DashboardPage() {
  const user = await validateSession();
  if (!user) redirect("/login");

  const [blogCount, postCount, publishedCount, activeRuns, recentRuns] =
    await Promise.all([
      prisma.blog.count(),
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.pipelineRun.count({
        where: { status: { in: ["QUEUED", "RUNNING"] } },
      }),
      prisma.pipelineRun.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { blog: { select: { name: true } } },
      }),
    ]);

  const stats = [
    { label: "Total Blogs", value: blogCount, icon: Globe, href: "/blogs" },
    { label: "Published Posts", value: publishedCount, icon: FileText, href: "/posts" },
    { label: "Total Posts", value: postCount, icon: FileText, href: "/posts" },
    { label: "Active Runs", value: activeRuns, icon: Workflow, href: "/pipeline" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-content">{value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/blogs/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Blog
          </Button>
        </Link>
        <Link href="/pipeline?action=enqueue">
          <Button variant="outline">
            <Workflow className="h-4 w-4" />
            Run Pipeline
          </Button>
        </Link>
      </div>

      {/* Recent pipeline runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pipeline Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pipeline runs yet.</p>
          ) : (
            <div className="space-y-3">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/pipeline/${run.id}`}
                  className="flex items-center justify-between rounded-lg border border-edge/60 p-3 transition-colors hover:bg-surface-alt dark:border-white/5"
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
                        {run.type} — {run.blog.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.createdAt.toLocaleDateString()} at{" "}
                        {run.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {run.finishedAt && run.startedAt && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(
                        (run.finishedAt.getTime() - run.startedAt.getTime()) /
                          1000,
                      )}
                      s
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

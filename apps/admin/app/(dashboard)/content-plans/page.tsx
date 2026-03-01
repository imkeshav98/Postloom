import Link from "next/link";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";

const statusColors: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  SKIPPED: "bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400",
};

export default async function ContentPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; blogId?: string }>;
}) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.blogId) where.blogId = sp.blogId;

  const [plans, total, blogs] = await Promise.all([
    prisma.contentPlan.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        blog: { select: { name: true } },
        targetKeyword: { select: { keyword: true, searchVolume: true } },
      },
    }),
    prisma.contentPlan.count({ where }),
    prisma.blog.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function filterUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (overrides.status ?? sp.status) p.set("status", overrides.status ?? sp.status!);
    if (overrides.blogId ?? sp.blogId) p.set("blogId", overrides.blogId ?? sp.blogId!);
    if (overrides.page) p.set("page", overrides.page);
    const qs = p.toString();
    return `/content-plans${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content">Content Plans</h2>
        <p className="text-sm text-muted-foreground">{total} plan{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["", "PLANNED", "IN_PROGRESS", "COMPLETED", "SKIPPED"].map((s) => (
          <Link
            key={s}
            href={filterUrl({ status: s, page: "1" })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (sp.status || "") === s
                ? "bg-primary/10 text-primary"
                : "bg-surface-alt text-muted-foreground hover:text-content"
            }`}
          >
            {s.replace("_", " ") || "All"}
          </Link>
        ))}
        <span className="mx-1 text-muted-foreground/30">|</span>
        <Link
          href="/content-plans"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !sp.blogId
              ? "bg-primary/10 text-primary"
              : "bg-surface-alt text-muted-foreground hover:text-content"
          }`}
        >
          All Blogs
        </Link>
        {blogs.map((b) => (
          <Link
            key={b.id}
            href={filterUrl({ blogId: b.id, page: "1" })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sp.blogId === b.id
                ? "bg-primary/10 text-primary"
                : "bg-surface-alt text-muted-foreground hover:text-content"
            }`}
          >
            {b.name}
          </Link>
        ))}
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No content plans found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-edge/60 dark:divide-white/5">
              {plans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/content-plans/${plan.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-alt"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">
                      {plan.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan.blog.name}
                      {plan.targetKeyword && ` · ${plan.targetKeyword.keyword}`}
                      {plan.clusterGroup && ` · ${plan.clusterGroup}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    {plan.isHub && (
                      <Badge variant="outline" className="text-xs">Hub</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">P{plan.priority}</span>
                    <Badge
                      variant="secondary"
                      className={statusColors[plan.status] ?? ""}
                    >
                      {plan.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={filterUrl({ page: String(p) })}
              className={`flex h-8 w-8 items-center justify-center rounded-md text-xs ${
                p === page
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-alt text-muted-foreground hover:text-content"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

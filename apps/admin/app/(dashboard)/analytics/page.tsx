import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Clock, TrendingUp } from "lucide-react";

interface AnalyticsPageProps {
  searchParams: Promise<{ blogId?: string; days?: string }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const user = await validateSession();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const blogId = sp.blogId;
  const days = parseInt(sp.days || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { date: { gte: since } };
  if (blogId) where.post = { blogId };

  const [blogs, metrics, topPosts, dailyData] = await Promise.all([
    prisma.blog.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.postPerformance.aggregate({
      where,
      _sum: { pageViews: true, uniqueVisitors: true },
      _avg: { bounceRate: true, avgTimeOnPage: true, googlePosition: true },
    }),
    prisma.postPerformance.groupBy({
      by: ["postId"],
      where,
      _sum: { pageViews: true, uniqueVisitors: true },
      orderBy: { _sum: { pageViews: "desc" } },
      take: 10,
    }),
    prisma.postPerformance.groupBy({
      by: ["date"],
      where,
      _sum: { pageViews: true, uniqueVisitors: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Fetch post details for top posts
  const postIds = topPosts.map((p) => p.postId);
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true, slug: true, blog: { select: { name: true } } },
  });
  const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));

  const totalViews = metrics._sum.pageViews ?? 0;
  const totalVisitors = metrics._sum.uniqueVisitors ?? 0;
  const avgBounce = metrics._avg.bounceRate != null ? metrics._avg.bounceRate.toFixed(1) : "N/A";
  const avgTime = metrics._avg.avgTimeOnPage != null ? Math.round(metrics._avg.avgTimeOnPage) : null;
  const avgPosition = metrics._avg.googlePosition != null ? metrics._avg.googlePosition.toFixed(1) : "N/A";

  const timeRanges = [
    { label: "7d", value: "7" },
    { label: "30d", value: "30" },
    { label: "90d", value: "90" },
  ];

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const newBlog = overrides.blogId !== undefined ? overrides.blogId : blogId;
    const newDays = overrides.days !== undefined ? overrides.days : String(days);
    if (newBlog) p.set("blogId", newBlog);
    if (newDays && newDays !== "30") p.set("days", newDays);
    const qs = p.toString();
    return `/analytics${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-content">Analytics</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={buildHref({ blogId: undefined })}>
          <Badge
            variant={!blogId ? "default" : "outline"}
            className="cursor-pointer"
          >
            All Blogs
          </Badge>
        </Link>
        {blogs.map((blog) => (
          <Link key={blog.id} href={buildHref({ blogId: blog.id })}>
            <Badge
              variant={blogId === blog.id ? "default" : "outline"}
              className="cursor-pointer"
            >
              {blog.name}
            </Badge>
          </Link>
        ))}

        <div className="mx-2 h-5 w-px bg-edge/60 dark:bg-white/10" />

        {timeRanges.map((range) => (
          <Link key={range.value} href={buildHref({ days: range.value })}>
            <Badge
              variant={String(days) === range.value ? "default" : "outline"}
              className="cursor-pointer"
            >
              {range.label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Views</p>
              <p className="text-2xl font-bold text-content">{totalViews.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Visitors</p>
              <p className="text-2xl font-bold text-content">{totalVisitors.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Time on Page</p>
              <p className="text-2xl font-bold text-content">
                {avgTime != null ? `${avgTime}s` : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Google Position</p>
              <p className="text-2xl font-bold text-content">{avgPosition}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bounce rate note */}
      {avgBounce !== "N/A" && (
        <p className="text-sm text-muted-foreground">
          Average bounce rate: <span className="font-medium text-content">{avgBounce}%</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top posts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Posts by Page Views</CardTitle>
          </CardHeader>
          <CardContent>
            {topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No performance data yet.</p>
            ) : (
              <div className="space-y-3">
                {topPosts.map((tp, i) => {
                  const post = postMap[tp.postId];
                  return (
                    <div
                      key={tp.postId}
                      className="flex items-center justify-between rounded-lg border border-edge/60 p-3 dark:border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-content">
                            {post?.title ?? "Unknown Post"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {post?.blog.name ?? ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-right">
                        <div>
                          <p className="text-sm font-semibold text-content">
                            {(tp._sum.pageViews ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-content">
                            {(tp._sum.uniqueVisitors ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">visitors</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily totals */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daily data yet.</p>
            ) : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge/60 dark:border-white/5">
                      <th className="pb-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Views</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((d) => (
                      <tr key={d.date.toISOString()} className="border-b border-edge/30 dark:border-white/5">
                        <td className="py-2 text-content">
                          {d.date.toLocaleDateString()}
                        </td>
                        <td className="py-2 text-right text-content">
                          {(d._sum.pageViews ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-content">
                          {(d._sum.uniqueVisitors ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

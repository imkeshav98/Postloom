import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const blogId = searchParams.get("blogId");
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { date: { gte: since } };
  if (blogId) where.post = { blogId };

  const metrics = await prisma.postPerformance.aggregate({
    where,
    _sum: { pageViews: true, uniqueVisitors: true },
    _avg: { bounceRate: true, avgTimeOnPage: true, googlePosition: true },
  });

  // Top posts by page views
  const topPosts = await prisma.postPerformance.groupBy({
    by: ["postId"],
    where,
    _sum: { pageViews: true, uniqueVisitors: true },
    orderBy: { _sum: { pageViews: "desc" } },
    take: 10,
  });

  const postIds = topPosts.map((p) => p.postId);
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true, slug: true, blog: { select: { name: true } } },
  });
  const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));

  const topPostsWithTitles = topPosts.map((p) => ({
    ...p,
    post: postMap[p.postId],
  }));

  return NextResponse.json({
    summary: metrics,
    topPosts: topPostsWithTitles,
  });
}

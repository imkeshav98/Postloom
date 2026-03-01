import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, blog: { select: { name: true } } },
  });

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const daily = await prisma.postPerformance.findMany({
    where: { postId: id, date: { gte: since } },
    orderBy: { date: "asc" },
    select: {
      date: true,
      pageViews: true,
      uniqueVisitors: true,
      bounceRate: true,
      avgTimeOnPage: true,
      googlePosition: true,
    },
  });

  const totals = await prisma.postPerformance.aggregate({
    where: { postId: id, date: { gte: since } },
    _sum: { pageViews: true, uniqueVisitors: true },
    _avg: { bounceRate: true, avgTimeOnPage: true, googlePosition: true },
  });

  return NextResponse.json({ post, daily, totals });
}

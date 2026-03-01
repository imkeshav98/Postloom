import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const blogId = searchParams.get("blogId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (blogId) where.blogId = blogId;
  if (status) where.status = status;

  const [plans, total] = await Promise.all([
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
  ]);

  return NextResponse.json({ plans, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, blogId, targetKeywordId, priority, outline, clusterGroup, isHub } = body;

  if (!title || !blogId) {
    return NextResponse.json({ error: "title and blogId are required" }, { status: 400 });
  }

  const plan = await prisma.contentPlan.create({
    data: {
      title,
      blogId,
      targetKeywordId: targetKeywordId || null,
      priority: priority ?? 0,
      outline: outline || null,
      clusterGroup: clusterGroup || null,
      isHub: isHub ?? false,
    },
    include: {
      blog: { select: { name: true } },
      targetKeyword: { select: { keyword: true } },
    },
  });

  return NextResponse.json(plan, { status: 201 });
}

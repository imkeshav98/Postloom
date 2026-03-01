import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const blogId = searchParams.get("blogId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (blogId) where.blogId = blogId;

  const runs = await prisma.pipelineRun.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      blog: { select: { name: true } },
      _count: { select: { steps: true } },
    },
  });

  return NextResponse.json(runs);
}

export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { blogId, type } = body;

  if (!blogId || !type) {
    return NextResponse.json(
      { error: "blogId and type are required" },
      { status: 400 },
    );
  }

  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) {
    return NextResponse.json({ error: "Blog not found" }, { status: 404 });
  }

  const run = await prisma.pipelineRun.create({
    data: {
      blogId,
      type,
      status: "QUEUED",
      priority: type === "SETUP" ? 10 : 0,
      idempotencyKey: `admin-${type}-${blogId}-${Date.now()}`,
      input: { niche: blog.niche },
      requestedById: user.id,
    },
  });

  return NextResponse.json(run, { status: 201 });
}

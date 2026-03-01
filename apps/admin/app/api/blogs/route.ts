import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { posts: true, pipelineRuns: true } },
      siteConfig: { select: { palette: true } },
    },
  });

  return NextResponse.json(blogs);
}

export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, slug, niche, description, domain, language } = body;

  if (!name || !slug || !niche) {
    return NextResponse.json(
      { error: "Name, slug, and niche are required" },
      { status: 400 },
    );
  }

  // Check slug uniqueness
  const existing = await prisma.blog.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const blog = await prisma.blog.create({
    data: {
      name,
      slug,
      niche,
      description: description || null,
      domain: domain || null,
      language: language || "en",
      siteConfig: {
        create: { palette: "default", postsPerPage: 10 },
      },
    },
  });

  // Auto-enqueue SETUP pipeline
  await prisma.pipelineRun.create({
    data: {
      blogId: blog.id,
      type: "SETUP",
      status: "QUEUED",
      priority: 10,
      idempotencyKey: `setup-${blog.id}-${Date.now()}`,
      input: { niche: blog.niche },
      requestedById: user.id,
    },
  });

  return NextResponse.json(blog, { status: 201 });
}

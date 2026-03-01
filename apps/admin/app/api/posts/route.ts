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

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      include: {
        blog: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, blogId, categoryId, contentMarkdown, excerpt, metaTitle, metaDescription, status } = body;

  if (!title || !blogId) {
    return NextResponse.json({ error: "title and blogId are required" }, { status: 400 });
  }

  const slug =
    body.slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const existing = await prisma.post.findFirst({
    where: { blogId, slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists for this blog" }, { status: 409 });
  }

  const content = contentMarkdown || "";
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      blogId,
      categoryId: categoryId || null,
      contentMarkdown: content,
      excerpt: excerpt || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      status: status || "DRAFT",
      aiGenerated: false,
      humanEdited: true,
      wordCount: words,
      readingTime: Math.max(1, Math.ceil(words / 200)),
    },
    include: {
      blog: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}

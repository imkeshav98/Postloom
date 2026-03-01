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

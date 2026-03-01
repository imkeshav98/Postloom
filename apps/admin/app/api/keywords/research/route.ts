import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { blogId } = body;

  if (!blogId) return NextResponse.json({ error: "blogId is required" }, { status: 400 });

  const blog = await prisma.blog.findUnique({ where: { id: blogId } });
  if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });

  const run = await prisma.pipelineRun.create({
    data: {
      blogId,
      type: "RESEARCH",
      status: "QUEUED",
      priority: 0,
      idempotencyKey: `research-${blogId}-${Date.now()}`,
      input: { niche: blog.niche },
      requestedById: user.id,
    },
  });

  return NextResponse.json(run, { status: 201 });
}

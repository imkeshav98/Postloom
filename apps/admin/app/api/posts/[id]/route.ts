import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      blog: { select: { id: true, name: true, domain: true } },
      category: { select: { id: true, name: true } },
      tags: true,
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, slug, excerpt, status, metaTitle, metaDescription, contentMarkdown, categoryId } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {
    ...(title && { title }),
    ...(slug && { slug }),
    ...(excerpt !== undefined && { excerpt }),
    ...(status && { status }),
    ...(metaTitle !== undefined && { metaTitle }),
    ...(metaDescription !== undefined && { metaDescription }),
    ...(categoryId !== undefined && { categoryId: categoryId || null }),
  };

  if (contentMarkdown !== undefined) {
    data.contentMarkdown = contentMarkdown;
    data.humanEdited = true;
    const words = contentMarkdown.trim().split(/\s+/).filter(Boolean).length;
    data.wordCount = words;
    data.readingTime = Math.max(1, Math.ceil(words / 200));
  }

  const post = await prisma.post.update({
    where: { id },
    data,
    include: {
      blog: { select: { id: true, name: true, domain: true } },
      category: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

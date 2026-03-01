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
  const { title, slug, excerpt, status, metaTitle, metaDescription, contentMarkdown, categoryId, scheduledAt } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {
    ...(title && { title }),
    ...(slug && { slug }),
    ...(excerpt !== undefined && { excerpt }),
    ...(status && { status }),
    ...(metaTitle !== undefined && { metaTitle }),
    ...(metaDescription !== undefined && { metaDescription }),
    ...(categoryId !== undefined && { categoryId: categoryId || null }),
    ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
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

  // Get the post's slug so we can clean up links in other posts' content
  const post = await prisma.post.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (post) {
    // Find all posts that link TO this post and remove the markdown links from their content
    const incomingLinks = await prisma.internalLink.findMany({
      where: { targetPostId: id },
      select: { sourcePostId: true, anchorText: true },
    });

    for (const link of incomingLinks) {
      const sourcePost = await prisma.post.findUnique({
        where: { id: link.sourcePostId },
        select: { contentMarkdown: true },
      });
      if (!sourcePost?.contentMarkdown) continue;

      let cleaned = sourcePost.contentMarkdown;
      // Remove inline links like [anchor text](/slug)
      cleaned = cleaned.replace(
        new RegExp(`\\[([^\\]]*?)\\]\\(\\/${escapeRegex(post.slug)}\\)`, "g"),
        "$1",
      );
      // Remove full appended sentences like "\n\nYou might also enjoy our guide on [anchor](/slug)."
      cleaned = cleaned.replace(
        new RegExp(`\\n\\nYou might also enjoy our guide on [^.]*\\/${escapeRegex(post.slug)}\\)\\.`, "g"),
        "",
      );

      if (cleaned !== sourcePost.contentMarkdown) {
        await prisma.post.update({
          where: { id: link.sourcePostId },
          data: { contentMarkdown: cleaned },
        });
      }
    }
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

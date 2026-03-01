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
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      siteConfig: true,
      categories: { orderBy: { name: "asc" } },
      _count: { select: { posts: true, keywords: true, pipelineRuns: true } },
    },
  });

  if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(blog);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, slug, niche, description, domain, language, defaultAuthor, logoUrl, adsenseId, siteConfig } = body;

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(niche && { niche }),
      ...(description !== undefined && { description }),
      ...(domain !== undefined && { domain: domain || null }),
      ...(language && { language }),
      ...(defaultAuthor && { defaultAuthor }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(adsenseId !== undefined && { adsenseId: adsenseId || null }),
    },
  });

  if (siteConfig && typeof siteConfig === "object") {
    const sc = siteConfig as Record<string, unknown>;
    await prisma.siteConfig.upsert({
      where: { blogId: id },
      create: {
        blogId: id,
        ...(sc.palette !== undefined && { palette: sc.palette as string }),
        ...(sc.googleAnalyticsId !== undefined && { googleAnalyticsId: (sc.googleAnalyticsId as string) || null }),
        ...(sc.googleSearchConsoleKey !== undefined && { googleSearchConsoleKey: (sc.googleSearchConsoleKey as string) || null }),
        ...(sc.twitterHandle !== undefined && { twitterHandle: (sc.twitterHandle as string) || null }),
        ...(sc.facebookUrl !== undefined && { facebookUrl: (sc.facebookUrl as string) || null }),
        ...(sc.postsPerPage !== undefined && { postsPerPage: sc.postsPerPage as number }),
        ...(sc.enableComments !== undefined && { enableComments: sc.enableComments as boolean }),
        ...(sc.faviconUrl !== undefined && { faviconUrl: (sc.faviconUrl as string) || null }),
        ...(sc.ogImageUrl !== undefined && { ogImageUrl: (sc.ogImageUrl as string) || null }),
        ...(sc.heroImageUrl !== undefined && { heroImageUrl: (sc.heroImageUrl as string) || null }),
      },
      update: {
        ...(sc.palette !== undefined && { palette: sc.palette as string }),
        ...(sc.googleAnalyticsId !== undefined && { googleAnalyticsId: (sc.googleAnalyticsId as string) || null }),
        ...(sc.googleSearchConsoleKey !== undefined && { googleSearchConsoleKey: (sc.googleSearchConsoleKey as string) || null }),
        ...(sc.twitterHandle !== undefined && { twitterHandle: (sc.twitterHandle as string) || null }),
        ...(sc.facebookUrl !== undefined && { facebookUrl: (sc.facebookUrl as string) || null }),
        ...(sc.postsPerPage !== undefined && { postsPerPage: sc.postsPerPage as number }),
        ...(sc.enableComments !== undefined && { enableComments: sc.enableComments as boolean }),
        ...(sc.faviconUrl !== undefined && { faviconUrl: (sc.faviconUrl as string) || null }),
        ...(sc.ogImageUrl !== undefined && { ogImageUrl: (sc.ogImageUrl as string) || null }),
        ...(sc.heroImageUrl !== undefined && { heroImageUrl: (sc.heroImageUrl as string) || null }),
      },
    });
  }

  const updated = await prisma.blog.findUnique({
    where: { id },
    include: { siteConfig: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.blog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

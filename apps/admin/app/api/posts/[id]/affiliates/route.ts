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
  const links = await prisma.affiliateLink.findMany({
    where: { postId: id },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(links);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { url, anchorText, platform } = body;

  if (!url || !anchorText || !platform) {
    return NextResponse.json({ error: "url, anchorText, and platform are required" }, { status: 400 });
  }

  const link = await prisma.affiliateLink.create({
    data: { url, anchorText, platform, postId: id },
  });

  return NextResponse.json(link, { status: 201 });
}

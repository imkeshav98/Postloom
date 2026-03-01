import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { publish, scheduledAt } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: Record<string, any>;

  if (scheduledAt) {
    data = {
      status: "SCHEDULED",
      scheduledAt: new Date(scheduledAt),
      publishedAt: null,
    };
  } else if (publish !== false) {
    data = {
      status: "PUBLISHED",
      publishedAt: new Date(),
      scheduledAt: null,
    };
  } else {
    data = {
      status: "DRAFT",
      publishedAt: null,
      scheduledAt: null,
    };
  }

  const post = await prisma.post.update({ where: { id }, data });

  return NextResponse.json(post);
}

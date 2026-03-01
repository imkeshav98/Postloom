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
  const plan = await prisma.contentPlan.findUnique({
    where: { id },
    include: {
      blog: { select: { name: true } },
      targetKeyword: { select: { keyword: true, searchVolume: true, difficulty: true } },
    },
  });

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, status, priority, outline, clusterGroup, isHub, targetKeywordId } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {
    ...(title && { title }),
    ...(status && { status }),
    ...(priority !== undefined && { priority }),
    ...(outline !== undefined && { outline }),
    ...(clusterGroup !== undefined && { clusterGroup: clusterGroup || null }),
    ...(isHub !== undefined && { isHub }),
    ...(targetKeywordId !== undefined && { targetKeywordId: targetKeywordId || null }),
  };

  const plan = await prisma.contentPlan.update({
    where: { id },
    data,
    include: {
      blog: { select: { name: true } },
      targetKeyword: { select: { keyword: true } },
    },
  });

  return NextResponse.json(plan);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.contentPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

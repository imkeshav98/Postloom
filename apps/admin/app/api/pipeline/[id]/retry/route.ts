import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@postloom/database";
import { validateSession } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const run = await prisma.pipelineRun.findUnique({
    where: { id },
    select: { id: true, status: true, attempts: true, maxAttempts: true },
  });

  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (run.status !== "FAILED") {
    return NextResponse.json({ error: "Only failed runs can be retried" }, { status: 400 });
  }

  if (run.attempts >= run.maxAttempts) {
    // Reset attempts to allow more retries
    await prisma.pipelineRun.update({
      where: { id },
      data: { status: "QUEUED", finishedAt: null, lockedAt: null, error: Prisma.DbNull, attempts: run.attempts },
    });
  } else {
    await prisma.pipelineRun.update({
      where: { id },
      data: { status: "QUEUED", finishedAt: null, lockedAt: null, error: Prisma.DbNull },
    });
  }

  return NextResponse.json({ success: true });
}

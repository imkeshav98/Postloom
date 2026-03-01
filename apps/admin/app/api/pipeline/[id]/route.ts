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
  const run = await prisma.pipelineRun.findUnique({
    where: { id },
    include: {
      blog: { select: { name: true, niche: true } },
      steps: { orderBy: { createdAt: "asc" } },
      requestedBy: { select: { email: true } },
    },
  });

  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(run);
}

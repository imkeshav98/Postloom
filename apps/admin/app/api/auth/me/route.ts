import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET() {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@postloom/database";
import { verifyPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // CSRF: validate Origin header
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const token = await createSession(user.id);
  const cookie = setSessionCookie(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookie);
  return response;
}

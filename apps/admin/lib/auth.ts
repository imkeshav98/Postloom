import { prisma } from "@postloom/database";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";

const SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });

  return token;
}

export async function validateSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  // Sliding window: extend session if more than 1 day old
  const oneDay = 24 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt.getTime() > oneDay) {
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_DURATION_MS) },
    });
  }

  return session.user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const tokenHash = hashToken(token);
  await prisma.adminSession.deleteMany({ where: { tokenHash } });
  cookieStore.delete(SESSION_COOKIE);
}

export function setSessionCookie(token: string) {
  // Return cookie options (caller sets via Response headers)
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };
}

/**
 * 会话管理 —— 不透明 token 存 DB + httpOnly cookie
 * 仅供服务端（route handler）引用，禁止在客户端组件 import（依赖 next/headers）
 */
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE = "bh_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 天

export interface AuthUser {
  id: string;
  username: string;
}

function sha256(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** 创建会话并写入 cookie，返回原始 token（调用方通常无需使用） */
export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
  return token;
}

/** 删除会话并清空 cookie（幂等） */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  cookieStore.set(SESSION_COOKIE, "", cookieOptions(0));
}

/** 从 cookie 解析当前登录用户；未登录/过期返回 null */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return { id: session.user.id, username: session.user.username };
}

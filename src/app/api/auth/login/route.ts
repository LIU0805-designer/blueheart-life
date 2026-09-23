/**
 * POST /api/auth/login
 * 登录；不区分「用户不存在」与「密码错误」，防止用户名枚举
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return Response.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return Response.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    await createSession(user.id);

    return Response.json({ user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}

/**
 * POST /api/auth/register
 * 注册新用户；第一个注册的账号自动继承现有匿名对话历史
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return Response.json({ error: "用户名已被使用" }, { status: 409 });
    }

    const isFirst = (await prisma.user.count()) === 0;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, passwordHash },
    });

    // 第一个注册的账号继承现有匿名对话历史（userId 为 null 的旧数据）
    if (isFirst) {
      await prisma.conversation.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      });
    }

    await createSession(user.id);

    return Response.json(
      { user: { id: user.id, username: user.username } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}

/**
 * GET /api/history
 * 获取当前用户的对话列表
 */
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        crisisFlag: true,
      },
      take: 50,
    });

    return Response.json({ conversations });
  } catch {
    return Response.json(
      { error: "获取对话列表失败" },
      { status: 500 }
    );
  }
}

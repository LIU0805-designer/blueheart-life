/**
 * GET /api/history
 * 获取对话列表
 */
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
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

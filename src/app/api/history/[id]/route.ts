/**
 * GET /api/history/[id]
 * 获取当前用户某条对话的所有消息（校验归属）
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return Response.json({ error: "对话不存在" }, { status: 404 });
    }

    return Response.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        crisisFlag: conversation.crisisFlag,
      },
      messages: conversation.messages,
    });
  } catch {
    return Response.json(
      { error: "获取对话详情失败" },
      { status: 500 }
    );
  }
}

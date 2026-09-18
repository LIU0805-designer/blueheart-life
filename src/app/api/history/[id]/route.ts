/**
 * GET /api/history/[id]
 * 获取特定对话的所有消息
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
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

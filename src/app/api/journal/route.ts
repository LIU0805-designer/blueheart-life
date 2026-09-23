/**
 * GET /api/journal — 获取日记列表
 * POST /api/journal — 为对话生成情绪日记
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { deepseek } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/auth/session";

/* ──── 获取日记列表 ──── */

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const entries = await prisma.journalEntry.findMany({
      where: { conversation: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const data = entries.map((e) => ({
      id: e.id,
      conversationId: e.conversationId,
      mood: e.mood,
      emotions: JSON.parse(e.emotions),
      summary: e.summary,
      highlights: JSON.parse(e.highlights),
      createdAt: e.createdAt,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json({ error: "加载日记失败" }, { status: 500 });
  }
}

/* ──── 生成情绪日记 ──── */

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "缺少 conversationId" }, { status: 400 });
    }

    // 先校验对话归属（越权访问返回 404，不泄露存在性）
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation || conversation.messages.length === 0) {
      return NextResponse.json({ error: "对话不存在或为空" }, { status: 404 });
    }

    // 检查是否已有日记（此时已确认对话归当前用户所有）
    const existing = await prisma.journalEntry.findUnique({
      where: { conversationId },
    });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        conversationId: existing.conversationId,
        mood: existing.mood,
        emotions: JSON.parse(existing.emotions),
        summary: existing.summary,
        highlights: JSON.parse(existing.highlights),
        createdAt: existing.createdAt,
        existed: true,
      });
    }

    // 提取用户消息
    const userMessages = conversation.messages
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    const aiMessages = conversation.messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content);

    if (userMessages.length === 0) {
      return NextResponse.json({ error: "对话中没有用户消息" }, { status: 400 });
    }

    // 生成对话文本摘要
    const conversationText = userMessages
      .map((m, i) => `用户：${m}`)
      .join("\n\n");

    // 用 AI 分析情绪
    const analysis = await analyzeEmotions(conversationText);

    // 保存到数据库
    const entry = await prisma.journalEntry.create({
      data: {
        conversationId,
        mood: analysis.mood,
        emotions: JSON.stringify(analysis.emotions),
        summary: analysis.summary,
        highlights: JSON.stringify(analysis.highlights),
      },
    });

    return NextResponse.json({
      id: entry.id,
      conversationId: entry.conversationId,
      mood: analysis.mood,
      emotions: analysis.emotions,
      summary: analysis.summary,
      highlights: analysis.highlights,
      createdAt: entry.createdAt,
      existed: false,
    });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    return NextResponse.json({ error: "生成日记失败" }, { status: 500 });
  }
}

/* ──── AI 情绪分析 ──── */

async function analyzeEmotions(conversationText: string): Promise<{
  mood: string;
  emotions: Array<{ name: string; intensity: number }>;
  summary: string;
  highlights: string[];
}> {
  const prompt = `你是一位心理陪伴者的助手。请分析以下对话中用户的情绪状态，用 JSON 格式输出。

要求：
1. mood: 整体情绪基调，只能是 "positive"、"neutral"、"negative"、"mixed" 之一
2. emotions: 检测到的情绪列表，每个包含 name（情绪名）和 intensity（1-10的强度）
3. summary: 一段 2-4 句话的中文摘要，用第一人称视角（"你"），像日记一样描述这次对话中的情绪历程。语气温柔、理解、不评判。
4. highlights: 从用户消息中摘取 1-3 句最能体现情绪状态的原句

只输出 JSON，不要其他内容：
{"mood": "...", "emotions": [...], "summary": "...", "highlights": [...]}

对话内容：
${conversationText.slice(0, 3000)}`;

  try {
    const res = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 600,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices[0]?.message?.content?.trim() || "";
    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        mood: parsed.mood || "neutral",
        emotions: parsed.emotions || [],
        summary: parsed.summary || "一次值得记录的对话。",
        highlights: parsed.highlights || [],
      };
    }
  } catch (e) {
    console.error("AI emotion analysis failed:", e);
  }

  // 降级：返回基本分析
  return {
    mood: "neutral",
    emotions: [],
    summary: "这是一次对话的记录。你的每一个感受都值得被看见。",
    highlights: [],
  };
}

/**
 * POST /api/chat
 * 流式对话接口 —— 蓝心的核心（DeepSeek 版）
 */
import { NextRequest } from "next/server";
import { deepseek } from "@/lib/ai/client";
import { BLUEHEART_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import {
  detectCrisisKeywords,
  CRISIS_PROMPT_SUFFIX,
} from "@/lib/ai/crisis-detector";
import { buildUserStateHint } from "@/lib/ai/user-state";
import { chatMessageSchema } from "@/lib/validators";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { checkChatRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. 校验输入
    const body = await req.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { message, conversationId, behavior } = parsed.data;

    // 2. 鉴权
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    // 2.5 限流（防刷 DeepSeek 额度）
    const rate = await checkChatRateLimit(user.id);
    if (!rate.ok) {
      return Response.json({ error: rate.message }, { status: 429 });
    }

    // 3. 加载或创建对话（校验归属）
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 30 } },
      });
      if (!conversation) {
        return Response.json(
          { error: "对话不存在" },
          { status: 404 }
        );
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          messages: {
            create: {
              role: "user",
              content: message,
            },
          },
        },
        include: { messages: true },
      });
    }

    // 3. 保存用户消息
    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: message,
        },
      });
    }

    // 4. 危机关键词检测
    const crisisCheck = detectCrisisKeywords(message);

    // 5. 构建历史消息上下文
    const historyMessages = (conversation.messages || []).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // 6. 构建用户消息（可能附加危机提示）
    const userContent = crisisCheck.isCrisis
      ? message + CRISIS_PROMPT_SUFFIX
      : message;

    // 6.5 用户行为信号 → 状态提示（让 AI 看见退缩 / 犹豫 / 难以表达）
    const stateHint = buildUserStateHint(
      behavior
        ? {
            lastMinimalResponse: behavior.lastMinimalResponse ?? null,
            messageTrend: behavior.messageTrend ?? "stable",
            inputBehavior: {
              hesitating: behavior.inputBehavior?.hesitating ?? false,
              hasRewritten: behavior.inputBehavior?.hasRewritten ?? false,
              hasAbandoned: behavior.inputBehavior?.hasAbandoned ?? false,
            },
          }
        : null
    );
    const systemContent = stateHint
      ? BLUEHEART_SYSTEM_PROMPT + "\n\n" + stateHint
      : BLUEHEART_SYSTEM_PROMPT;

    // 7. 调用 DeepSeek API 流式响应
    const stream = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
      messages: [
        { role: "system", content: systemContent },
        ...historyMessages,
        { role: "user", content: userContent },
      ],
    });

    // 8. 返回流式响应
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "token", text: delta })}\n\n`
                )
              );
            }
          }

          // 保存 AI 回复
          await prisma.message.create({
            data: {
              conversationId: conversation!.id,
              role: "assistant",
              content: fullText,
            },
          });

          // 如果触发危机，标记对话
          if (crisisCheck.isCrisis) {
            await prisma.conversation.update({
              where: { id: conversation!.id },
              data: { crisisFlag: true },
            });
          }

          // 如果是新对话，生成标题
          let title = conversation!.title;
          if (!title) {
            title = await generateTitle(message, fullText);
            await prisma.conversation.update({
              where: { id: conversation!.id },
              data: { title },
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", conversationId: conversation!.id, title: title || "新的对话" })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError) {
          console.error("Stream error:", streamError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "AI 响应出错，请稍后重试" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "服务器出错了，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * 从第一轮对话生成标题
 */
async function generateTitle(
  userMessage: string,
  aiReply: string
): Promise<string> {
  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 30,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "用5-10个字概括以下对话的主题。只输出标题本身，不要加引号或标点。",
        },
        { role: "user", content: userMessage },
        { role: "assistant", content: aiReply },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    return text || "新的对话";
  } catch {
    return "新的对话";
  }
}

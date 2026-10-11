/**
 * 聊天限流 —— 防止公开注册后有人刷 DeepSeek 额度。
 * 按「已入库的用户消息」统计，滚动时间窗口：
 *   - 每分钟上限：挡脚本/机器连发
 *   - 每 24 小时上限：挡无限烧额度
 * 改阈值只动下面的常量即可。
 */
import { prisma } from "@/lib/db/prisma";

const PER_MINUTE_LIMIT = 8;
const PER_DAY_LIMIT = 300;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  ok: boolean;
  message?: string;
}

/** 统计用户在指定时间窗口内发过的用户消息条数 */
async function countUserMessages(userId: string, since: Date): Promise<number> {
  return prisma.message.count({
    where: {
      conversation: { userId },
      role: "user",
      createdAt: { gte: since },
    },
  });
}

export async function checkChatRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const now = Date.now();

  const [perMinute, perDay] = await Promise.all([
    countUserMessages(userId, new Date(now - MINUTE_MS)),
    countUserMessages(userId, new Date(now - DAY_MS)),
  ]);

  if (perMinute >= PER_MINUTE_LIMIT) {
    return { ok: false, message: "你发消息太快了，先歇几秒再和我聊吧。" };
  }
  if (perDay >= PER_DAY_LIMIT) {
    return { ok: false, message: "今天已经聊了挺久啦，明天再来找我吧，我一直都在。" };
  }

  return { ok: true };
}

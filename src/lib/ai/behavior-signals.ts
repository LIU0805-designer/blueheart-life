/**
 * 蓝心 — 用户行为信号检测
 *
 * 不看脸、不看摄像头。只看用户「怎么打字」和「发了什么」。
 * 这些信号比表情更真实——因为它们是控制不了的。
 */

import type { ChatMessage } from "@/stores/chat-store";

/* ──── 简短回复检测 ──── */

export interface MinimalResponse {
  type: "dismissive" | "speechless" | "minimal" | "agreement";
  intensity: "medium" | "high";
}

/**
 * 检测用户是否发送了极简回复（"嗯"、"哦"、"…"等）
 *
 * 这类回复通常意味着：不想说话、在敷衍、或者说不出来。
 * 蓝心看到这类回复不应该继续正常对话，而应该放慢节奏、确认对方状态。
 */
export function detectMinimalResponse(text: string): MinimalResponse | null {
  const trimmed = text.trim();

  // 明确的同意 / 肯定词 → agreement（「中」「没毛病」「要」「这样也行」等）
  if (
    /^(好|好的|好呀|好嘞|行|可以|可以的|中|对|来|来吧|要|要的|试试|试试看|没问题|没毛病|这样也行|也行|可以吧|嗯嗯|ok)[！!。.~～]*$/i.test(
      trimmed
    )
  ) {
    return { type: "agreement", intensity: "medium" };
  }

  // 纯标点 / 省略号 → 无话可说
  if (/^[.。…、，,！!？?]+$/.test(trimmed)) {
    return { type: "speechless", intensity: "high" };
  }

  // 「嗯」——模糊，可能是同意也可能是退缩，交给 AI 结合上下文判断
  if (/^嗯+$/.test(trimmed)) {
    return { type: "minimal", intensity: "medium" };
  }

  // 明确的敷衍 / 叹气语气词 → 退缩
  if (/^[哦啊唉哎嗨嘿唔呃额]+$/.test(trimmed) && trimmed.length <= 3) {
    return { type: "dismissive", intensity: "high" };
  }

  // 极短回应（1-3 字）："好的"、"行吧"、"不知道"、"没事"、"随便"、"算了"
  if (trimmed.length <= 3) {
    // "算了" 系列 → 放弃表达
    if (/算了|没事|随便|没什么|不知道|不想说/.test(trimmed)) {
      return { type: "dismissive", intensity: "high" };
    }
    return { type: "minimal", intensity: "medium" };
  }

  // 4-6 字的消极回避
  if (trimmed.length <= 6) {
    if (/算了|不说了|就这样|没什么|无所谓/.test(trimmed)) {
      return { type: "dismissive", intensity: "medium" };
    }
  }

  return null;
}

/* ──── 消息长度趋势 ──── */

export type MessageTrend = "stable" | "shortening" | "lengthening" | "first_message";

/**
 * 分析用户消息的长度趋势
 *
 * 消息越写越短 → 可能在退缩、不想继续
 * 消息越写越长 → 在打开、愿意倾诉
 */
export function analyzeMessageTrend(messages: ChatMessage[]): MessageTrend {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < 2) return "first_message";

  // 取最近 5 条用户消息
  const recent = userMessages.slice(-5);
  const lengths = recent.map((m) => m.content.length);

  // 比较前半和后半的平均长度
  const mid = Math.floor(lengths.length / 2);
  const firstHalf = lengths.slice(0, mid);
  const secondHalf = lengths.slice(mid);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  // 变化超过 30% 才算趋势
  const ratio = secondAvg / Math.max(firstAvg, 1);

  if (ratio < 0.6) return "shortening";
  if (ratio > 1.5) return "lengthening";
  return "stable";
}

/* ──── 响应延迟评估 ──── */

/**
 * 根据最后一次用户消息和 AI 回复之间的时间差，评估用户的响应状态。
 * 这个值来自前端 (Date.now)，不在这里计算，只提供评估函数。
 */
export function evaluateResponseDelay(delayMs: number): {
  level: "normal" | "hesitant" | "very_slow";
  description: string;
} {
  if (delayMs < 30_000) {
    return { level: "normal", description: "正常节奏" };
  }
  if (delayMs < 120_000) {
    return { level: "hesitant", description: "犹豫了一下才回复" };
  }
  return { level: "very_slow", description: "过了很久才回复" };
}

/* ──── 输入行为评估 ──── */

export interface InputBehavior {
  /** 是否正在犹豫（输入框有内容但停留超过 5 秒没发送） */
  hesitating: boolean;
  /** 是否曾键入内容后又全部删掉 */
  rewritten: boolean;
  /** 是否曾键入较多内容（>10字）然后清空没发送 */
  abandoned: boolean;
  /** 当前输入已停留的秒数 */
  pauseSeconds: number;
}

/**
 * 根据输入框状态评估用户当前的行为信号
 */
export function evaluateInputBehavior(state: {
  hasText: boolean;
  textLength: number;
  pauseSeconds: number;
  rewriteCount: number;
  abandonedThisSession: boolean;
}): InputBehavior {
  return {
    hesitating: state.hasText && state.pauseSeconds > 5,
    rewritten: state.rewriteCount >= 2,
    abandoned: state.abandonedThisSession,
    pauseSeconds: state.pauseSeconds,
  };
}

/**
 * 蓝心 — 情绪色调系统
 *
 * 定义蓝心的 7 种情绪状态。
 * 每种情绪映射到不同的 TTS 语音参数（语速、音调、停顿）。
 * 通过关键词匹配从 AI 回复文本中检测主导情绪。
 */

export type EmotionTone =
  | "gentle" // 温柔 — 倾听、陪伴
  | "warm" // 温暖 — 鼓励、肯定
  | "calm" // 平静 — 日常对话
  | "thoughtful" // 沉思 — 思考、回应复杂感受
  | "concerned" // 关切 — 听到痛苦
  | "firm" // 坚定 — 危机时刻
  | "light"; // 轻松 — 偶尔幽默

export interface EmotionResult {
  tone: EmotionTone;
  label: string;
}

/* ──────── 中文标签 ──────── */

export const EMOTION_LABELS: Record<EmotionTone, string> = {
  gentle: "温柔",
  warm: "温暖",
  calm: "平静",
  thoughtful: "沉思",
  concerned: "关切",
  firm: "坚定",
  light: "轻松",
};

/* ──────── TTS 语速映射 ──────── */

export const EMOTION_RATE: Record<EmotionTone, number> = {
  gentle: 0.85,
  warm: 0.95,
  calm: 0.9,
  thoughtful: 0.78,
  concerned: 0.85,
  firm: 0.92,
  light: 1.05,
};

/* ──────── TTS 音调映射 ──────── */

export const EMOTION_PITCH: Record<EmotionTone, number> = {
  gentle: 0.98,
  warm: 1.08,
  calm: 1.0,
  thoughtful: 0.95,
  concerned: 0.97,
  firm: 1.02,
  light: 1.12,
};

/* ──────── 开口前自然停顿（毫秒） ──────── */

export const EMOTION_PAUSE: Record<EmotionTone, number> = {
  gentle: 400,
  warm: 200,
  calm: 300,
  thoughtful: 600,
  concerned: 500,
  firm: 150,
  light: 150,
};

/* ──────── 情绪检测 ──────── */

/**
 * 通过关键词加权匹配，判断文本的主导情绪
 *
 * 优先级:
 *   危机 > 关切 > 沉思 > 温暖 > 轻松 > 温柔 > 平静（默认）
 */
export function detectEmotion(text: string): EmotionResult {
  // 1. 危机信号 → 坚定
  if (multiMatch(text, ["热线", "求助", "一定要", "请务必", "安全第一", "你不是一个人", "陪着", "医生", "危机"]))
    return { tone: "firm", label: "坚定" };

  // 2. 关切信号
  if (multiMatch(text, ["听起来", "辛苦", "难过", "痛苦", "不容易", "承受", "很重", "心疼", "撑", "累坏了"]))
    return { tone: "concerned", label: "关切" };

  // 3. 沉思信号
  if (multiMatch(text, ["你觉得", "或许", "有时候", "看来", "也许", "怎么说", "想一想", "回头看", "意味着"]))
    return { tone: "thoughtful", label: "沉思" };

  // 4. 温暖信号
  if (multiMatch(text, ["可以试试", "慢慢来", "很棒", "没关系", "你做得", "相信你", "你的力量", "勇敢", "❤"]))
    return { tone: "warm", label: "温暖" };

  // 5. 轻松信号（单一命中即可）
  if (singleMatch(text, ["哈哈", "😊", "笑", "有趣", "开心", "轻松一下"]))
    return { tone: "light", label: "轻松" };

  // 6. 温柔信号
  if (multiMatch(text, ["嗯", "我在听", "说吧", "陪你", "一起", "不急", "按你", "舒服"]))
    return { tone: "gentle", label: "温柔" };

  // 默认：平静
  return { tone: "calm", label: "平静" };
}

/* ──────── 辅助 ──────── */

function multiMatch(text: string, keywords: string[]): boolean {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) count++;
    if (count >= 2) return true;
  }
  return false;
}

function singleMatch(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

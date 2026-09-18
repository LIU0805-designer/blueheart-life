/**
 * 百度短文本合成 TTS 客户端
 *
 * 免费额度：50,000 次/天，与 ASR 共享。
 * 使用与百度 ASR 相同的 OAuth 鉴权。
 *
 * API 文档：https://ai.baidu.com/ai-doc/SPEECH/Qk38y8lrl
 */

import type { EmotionTone } from "@/lib/ai/emotions";

/* ──── 常量 ──── */

const OAUTH_URL = "https://aip.baidubce.com/oauth/2.0/token";
const TTS_URL = "https://tsn.baidu.com/text2audio";

/** 度小柔 — 百度大模型温柔女声，成熟自然，适合心理陪伴 */
const VOICE_PER = 6567;

/** 语速 5（1-15，默认 5，自然语速） */
const SPEED = 5;

/** 音调 6（1-15，默认 5，偏暖） */
const PITCH = 6;

/** 音量 7（1-15，适中） */
const VOLUME = 7;

/* ──── 情绪 → 语速/音调映射（1-15，默认 5） ──── */

/** 语速：沉思/关切更慢，轻松稍快 */
const EMOTION_SPD: Record<EmotionTone, number> = {
  gentle: 4,
  warm: 5,
  calm: 5,
  thoughtful: 3,
  concerned: 3,
  firm: 5,
  light: 6,
};

/** 音调：温暖/轻松偏高（明亮），沉思/关切偏低（深沉） */
const EMOTION_PIT: Record<EmotionTone, number> = {
  gentle: 5,
  warm: 6,
  calm: 5,
  thoughtful: 4,
  concerned: 4,
  firm: 5,
  light: 7,
};

/* ──── 文本预处理 ──── */

/**
 * 把练习脚本转成适合 TTS 朗读的自然口语。
 *
 * 核心原则：
 * 1. 去排版标记 —【】变自然短语
 * 2. 去引号 — 中文引导语不需要引号声
 * 3. 去舞台指示 —"不要一口气全问完"这类是给蓝心看的
 * 4. 加句号 — 制造自然停顿
 */
function cleanText(script: string): string {
  return script
    // 段落之间加长停顿
    .replace(/\n{3,}/g, "……\n")
    .replace(/\n{2}/g, "……\n")
    .replace(/\n/g, " ")
    // 清理多余空白
    .replace(/\s{2,}/g, " ")
    .replace(/……\s*……/g, "……")
    .replace(/^[。，、]\s*/g, "")
    .replace(/。。/g, "。")
    .replace(/……。|。……/g, "……")
    .trim();
}

/* ──── Token 缓存 ──── */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(apiKey: string, secretKey: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const url = `${OAUTH_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`百度 OAuth 失败 [${res.status}]: ${body}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`百度 OAuth 未返回 token: ${JSON.stringify(data)}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 提前 6 天过期（实际 30 天）
  };

  return cachedToken.token;
}

/* ──── 公开 API ──── */

/**
 * 生成中文语音 MP3
 *
 * @param text  待合成文本（POST 最大 60KB，约 30,000 汉字）
 * @returns     MP3 Buffer
 */
export async function generateBaiduSpeech(
  text: string,
  apiKey: string,
  secretKey: string,
  emotion?: EmotionTone
): Promise<Buffer> {
  const token = await getAccessToken(apiKey, secretKey);

  const cleaned = cleanText(text);

  const params = new URLSearchParams();
  params.append("tok", token);
  params.append("tex", cleaned);
  params.append("cuid", "blueheart");
  params.append("ctp", "1");
  params.append("lan", "zh");
  params.append("spd", String(emotion ? EMOTION_SPD[emotion] : SPEED));
  params.append("pit", String(emotion ? EMOTION_PIT[emotion] : PITCH));
  params.append("vol", String(VOLUME));
  params.append("per", String(VOICE_PER));
  params.append("aue", "3"); // MP3

  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`百度 TTS 请求失败 [${res.status}]: ${body}`);
  }

  // 百度 TTS 成功时返回 audio/mpeg 二进制，失败时返回 JSON
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const errData = await res.json();
    throw new Error(`百度 TTS 合成失败 [${errData.err_no}]: ${errData.err_msg}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

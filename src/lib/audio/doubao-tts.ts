/**
 * 豆包（火山引擎）语音合成 2.0 TTS 客户端
 *
 * 使用火山引擎语音合成大模型 2.0（Seed-TTS 2.0）v3 单向流式接口。
 * 相比百度 TTS，豆包大模型音色的自然度和情感表现力更强（全网自然度盲测第一）。
 *
 * 注意：这是 2026 新版 v3 接口（资源 seed-tts-2.0），
 * 与旧版 v1 接口（资源 seed-tts-1.0，_moon_bigtts 音色需企业认证）完全不同。
 *
 * 文档：https://www.volcengine.com/docs/82379/2516290
 */

/* ──── 常量 ──── */

const TTS_URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional";
const RESOURCE_ID = "seed-tts-2.0";

/**
 * 知性灿灿 2.0 — 温柔成熟女声，适合心理陪伴
 * 其他可选：zh_female_kefunvsheng_uranus_bigtts（暖阳女声）、
 *          zh_female_shuangkuaisisi_uranus_bigtts（爽快思思）等
 */
const SPEAKER = "zh_female_cancan_uranus_bigtts";

/** 语速 -5（范围 -50~100，0=默认自然，负值更慢更温柔，正值更快） */
const SPEECH_RATE = -5;

/* ──── 文本预处理 ──── */

/**
 * 将文本转为适合 TTS 朗读的自然口语。
 */
function cleanText(script: string): string {
  return script
    // 段落间加停顿
    .replace(/\n{3,}/g, "……\n")
    .replace(/\n{2}/g, "……\n")
    .replace(/\n/g, " ")
    // 清理
    .replace(/\s{2,}/g, " ")
    .replace(/……\s*……/g, "……")
    .replace(/^[。，、]\s*/g, "")
    .replace(/。。/g, "。")
    .replace(/……。|。……/g, "……")
    .trim();
}

/* ──── 公开 API ──── */

export interface DoubaoSpeechConfig {
  appId: string;
  token: string;
}

/**
 * 生成中文语音 MP3
 *
 * @param text   待合成文本
 * @param config 火山引擎语音凭证（APP ID + Access Token）
 * @returns      MP3 Buffer
 */
export async function generateDoubaoSpeech(
  text: string,
  config: DoubaoSpeechConfig
): Promise<Buffer> {
  const cleaned = cleanText(text);

  const body = {
    user: { uid: "blueheart" },
    req_params: {
      text: cleaned,
      speaker: SPEAKER,
      audio_params: {
        format: "mp3",
        sample_rate: 24000,
        speech_rate: SPEECH_RATE,
      },
    },
  };

  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Resource-Id": RESOURCE_ID,
      "X-Api-App-Id": config.appId,
      "X-Api-Access-Key": config.token,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `豆包 TTS 请求失败 [${res.status}]: ${errText.slice(0, 500)}`
    );
  }

  // 响应是 NDJSON：逐行 JSON，code=0 的 data 字段是 base64 音频分片，20000000 表示结束
  const raw = await res.text();
  const chunks: Buffer[] = [];

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let parsed: { code?: number; data?: string; message?: string };
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const code = parsed.code;
    if (code === 0 && parsed.data) {
      chunks.push(Buffer.from(parsed.data, "base64"));
    } else if (code === 20000000) {
      break; // 正常结束事件
    } else if (code !== undefined && code !== 0) {
      throw new Error(
        `豆包 TTS 流错误 [${code}]: ${parsed.message || JSON.stringify(parsed)}`
      );
    }
  }

  if (chunks.length === 0) {
    throw new Error("豆包 TTS 返回空音频");
  }

  return Buffer.concat(chunks);
}

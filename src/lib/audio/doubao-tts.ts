/**
 * 豆包（火山引擎）语音合成 TTS 客户端
 *
 * 使用火山引擎语音合成 V1 API（大模型音色）。
 * 相比百度 TTS，豆包大模型音色的自然度和情感表现力更强。
 *
 * 文档：https://www.volcengine.com/docs/6561/79820
 */

/* ──── 常量 ──── */

const TTS_URL = "https://openspeech.bytedance.com/api/v1/tts";

/** 大模型女声 — 自然温暖，适合心理陪伴 */
const VOICE_TYPE = "zh_female_wanqudashu_moon_bigtts";

/** 语速 1.0（范围 0.2-3，默认 1.0） */
const SPEED = 1.0;

/** 采样率 24000 Hz */
const RATE = 24000;

/** 码率 160 kbps */
const BITRATE = 160;

/** 响度 1.0（范围 0.1-3） */
const LOUDNESS = 1.0;

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
 * @param config 火山引擎语音凭证
 * @returns      MP3 Buffer
 */
export async function generateDoubaoSpeech(
  text: string,
  config: DoubaoSpeechConfig
): Promise<Buffer> {
  const cleaned = cleanText(text);

  const body = {
    app: {
      appid: config.appId,
      token: config.token,
      cluster: "volcano_tts",
    },
    user: {
      uid: "blueheart",
    },
    audio: {
      voice_type: VOICE_TYPE,
      encoding: "mp3",
      speed_ratio: SPEED,
      rate: RATE,
      bitrate: BITRATE,
      loudness_ratio: LOUDNESS,
    },
    request: {
      reqid: crypto.randomUUID(),
      text: cleaned,
      operation: "query",
    },
  };

  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer;${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`豆包 TTS 请求失败 [${res.status}]: ${errText}`);
  }

  const data = await res.json();

  // 成功码是 3000
  if (data.code !== 3000) {
    throw new Error(
      `豆包 TTS 合成失败 [${data.code}]: ${data.message || JSON.stringify(data)}`
    );
  }

  // 音频是 base64 字符串，直接在 data 字段
  const audioBase64 = data.data;
  if (!audioBase64 || typeof audioBase64 !== "string") {
    throw new Error(
      `豆包 TTS 未返回音频数据: ${JSON.stringify(data).slice(0, 200)}`
    );
  }

  return Buffer.from(audioBase64, "base64");
}

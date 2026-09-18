/**
 * 豆包（火山引擎）语音合成 TTS 客户端
 *
 * 使用火山引擎语音合成 REST API 一次性合成。
 * 相比于百度 TTS，豆包语音模型 2.0 的自然度和情感表现力远超百度。
 *
 * 文档：https://www.volcengine.com/docs/6561/79820
 */

/* ──── 常量 ──── */

const TTS_URL = "https://openspeech.bytedance.com/api/v1/tts";

// 备用：新版域名
const TTS_URL_V2 = "https://openspeech.volcengine.com/api/v1/tts";

/** 清新女声 — 基础免费音色，无需额外申请权限 */
const VOICE_TYPE = "zh_female_qingxin";

/** 语速 1.0（范围 0.2-3，默认 1.0） */
const SPEED = 1.0;

/** 音量 1.1（范围 0.1-3） */
const VOLUME = 1.1;

/** 语调 1.05（范围 0.1-3，略微偏高更温暖） */
const PITCH = 1.05;

/* ──── 文本预处理 ──── */

/**
 * 将练习脚本转为自然口语。
 * 脚本本身已经是直接对用户说的话，这里只做格式清理。
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
      volume_ratio: VOLUME,
      pitch_ratio: PITCH,
    },
    request: {
      reqid: crypto.randomUUID(),
      text: cleaned,
      text_type: "plain",
      operation: "query",
      with_frontend: 1,
    },
  };

  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer;${config.token}`,
      "Resource-Id": "volc.tts.default",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`豆包 TTS 请求失败 [${res.status}]: ${errText}`);
  }

  // V1 API 返回 JSON，音频是 base64 编码的
  const data = await res.json();

  // 业务错误
  if (data.code && data.code !== 0) {
    throw new Error(`豆包 TTS 合成失败 [${data.code}]: ${data.message || JSON.stringify(data)}`);
  }

  // 解码 base64 音频
  const audioBase64 = data.data?.audio || data.audio;
  if (!audioBase64) {
    throw new Error(`豆包 TTS 未返回音频数据: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return Buffer.from(audioBase64, "base64");
}

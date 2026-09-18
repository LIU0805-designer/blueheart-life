/**
 * Microsoft Edge TTS 客户端
 *
 * 通过 WebSocket 连接 Bing Speech API（与 Edge 浏览器"大声朗读"同一后端），
 * 免费生成中文语音 MP3。无需任何 API Key。
 *
 * 协议来源：https://github.com/rany2/edge-tts
 */

/* ──── 常量 ──── */

const WS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";

/** 中文女声 — 温柔、清晰，适合冥想引导 */
const VOICE = "zh-CN-XiaoxiaoNeural";

/** 24kHz 48kbps 单声道 MP3 — 语音场景的最佳性价比 */
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

/* ──── 辅助 ──── */

/** 格式化 Edge TTS 协议消息（自定义 header 行 + 空行 + body） */
function fmtMsg(
  requestId: string,
  path: string,
  contentType: string,
  body: string
): string {
  return [
    `X-RequestId: ${requestId}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    `Path: ${path}`,
    "",
    body,
  ].join("\r\n");
}

/** 构建 SSML（冥想语速 -15%）并转义 XML 特殊字符 */
function buildSsml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="zh-CN"><voice name="${VOICE}"><prosody rate="-15%" pitch="0%">${escaped}</prosody></voice></speak>`;
}

/* ──── 公开 API ──── */

/**
 * 生成中文语音 MP3
 *
 * @param text 纯文本（≤ 10 分钟长度为宜）
 * @returns MP3 音频 Buffer
 */
export async function generateSpeech(text: string): Promise<Buffer> {
  const ws = new WebSocket(WS_URL);
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => {
      /* 1. 发送配置消息 */
      ws.send(
        fmtMsg(
          crypto.randomUUID(),
          "speech.config",
          "application/json",
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: false,
                    wordBoundaryEnabled: false,
                  },
                  outputFormat: OUTPUT_FORMAT,
                },
              },
            },
          })
        )
      );

      /* 2. 发送 SSML */
      ws.send(fmtMsg(crypto.randomUUID(), "ssml", "application/ssml+xml", buildSsml(text)));
    };

    ws.onmessage = (event) => {
      // binary → 音频数据
      if (typeof event.data !== "string") {
        chunks.push(Buffer.from(event.data as ArrayBuffer));
        return;
      }

      // text → 协议消息；收到 turn.end 表示音频结束
      const msg = event.data as string;
      if (msg.includes("Path: turn.end")) {
        ws.close(1000);
      }
    };

    ws.onclose = () => {
      if (chunks.length === 0) {
        reject(new Error("Edge TTS 未返回音频数据"));
      } else {
        resolve();
      }
    };

    ws.onerror = () => {
      reject(new Error("Edge TTS WebSocket 连接失败"));
    };
  });

  return Buffer.concat(chunks);
}

/**
 * POST /api/audio/tts
 *
 * 聊天消息朗读：把任意文本合成 MP3 返回。
 * 优先豆包（音质更自然），文本过长或失败时回退百度。
 *
 * body: { text: string }
 */

import { NextRequest } from "next/server";
import { generateDoubaoSpeech } from "@/lib/audio/doubao-tts";
import { generateBaiduSpeech } from "@/lib/audio/baidu-tts";
import { detectEmotion } from "@/lib/ai/emotions";

export async function POST(req: NextRequest) {
  let text = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!text) {
    return Response.json({ error: "文本为空" }, { status: 400 });
  }

  // 兜底截断，避免超长请求拖垮 TTS
  if (text.length > 1500) {
    text = text.slice(0, 1500);
  }

  // 情绪检测 → 决定语速/音调
  const emotion = detectEmotion(text).tone;

  const appId = process.env.DOUBAO_SPEECH_APPID || "";
  const token = process.env.DOUBAO_SPEECH_TOKEN || "";
  const apiKey = process.env.BAIDU_API_KEY || "";
  const secretKey = process.env.BAIDU_SECRET_KEY || "";

  const doubaoReady = Boolean(appId && token);
  const baiduReady = Boolean(apiKey && secretKey);

  if (!doubaoReady && !baiduReady) {
    return Response.json({ error: "未配置语音服务" }, { status: 500 });
  }

  try {
    let buffer: Buffer;

    // 豆包 TTS 单次文本上限约 1024 字节，长文本直接走百度（60KB 上限）
    const isLong = Buffer.byteLength(text, "utf8") > 900;

    if (doubaoReady && !isLong) {
      try {
        buffer = await generateDoubaoSpeech(text, { appId, token });
      } catch (err) {
        if (!baiduReady) throw err;
        console.warn("[TTS] 豆包合成失败，回退百度:", err);
        buffer = await generateBaiduSpeech(text, apiKey, secretKey, emotion);
      }
    } else if (baiduReady) {
      buffer = await generateBaiduSpeech(text, apiKey, secretKey);
    } else {
      // 只剩豆包（兜底），直接尝试
      buffer = await generateDoubaoSpeech(text, { appId, token });
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err: any) {
    console.error("[API] 聊天语音生成失败:", err);
    return Response.json({ error: "语音生成失败，请稍后重试" }, { status: 500 });
  }
}

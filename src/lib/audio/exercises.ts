/**
 * 练习音频缓存层
 *
 * 首次请求时调用 TTS 生成 MP3 并缓存到 public/audio/exercises/，
 * 后续请求直接读缓存。避免重复生成、加快响应。
 *
 * 优先级：豆包 TTS > 百度 TTS
 */

import fs from "fs/promises";
import path from "path";
import { generateDoubaoSpeech } from "./doubao-tts";
import { generateBaiduSpeech } from "./baidu-tts";
import { EXERCISES } from "@/lib/exercises";

const CACHE_DIR = path.join(process.cwd(), "public", "audio", "exercises");

function getDoubaoConfig() {
  const appId = process.env.DOUBAO_SPEECH_APPID || "";
  const token = process.env.DOUBAO_SPEECH_TOKEN || "";
  if (appId && token) return { appId, token };
  return null;
}

function getBaiduKeys() {
  return {
    apiKey: process.env.BAIDU_API_KEY || "",
    secretKey: process.env.BAIDU_SECRET_KEY || "",
  };
}

/**
 * 获取指定练习的疗愈引导音频
 */
export async function getExerciseAudio(exerciseId: string): Promise<Buffer> {
  const filePath = path.join(CACHE_DIR, `${exerciseId}.mp3`);

  // 命中缓存
  try {
    return await fs.readFile(filePath);
  } catch {
    /* 缓存未命中 — 继续生成 */
  }

  const exercise = EXERCISES.find((e) => e.id === exerciseId);
  if (!exercise) throw new Error(`未找到练习: ${exerciseId}`);

  console.log(`[Audio] 正在生成疗愈音频: ${exercise.name} (${exercise.script.length} 字符)`);

  let buffer: Buffer;

  // 优先使用豆包 TTS
  const doubao = getDoubaoConfig();
  if (doubao) {
    console.log("[Audio] 使用豆包 TTS");
    buffer = await generateDoubaoSpeech(exercise.script, doubao);
  } else {
    // 回退到百度 TTS
    const { apiKey, secretKey } = getBaiduKeys();
    if (!apiKey || !secretKey) {
      throw new Error(
        "未配置 TTS。请在 .env 中设置 DOUBAO_SPEECH_APPID + DOUBAO_SPEECH_TOKEN（推荐），或 BAIDU_API_KEY + BAIDU_SECRET_KEY"
      );
    }
    console.log("[Audio] 使用百度 TTS（回退）");
    buffer = await generateBaiduSpeech(exercise.script, apiKey, secretKey);
  }

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(filePath, buffer);

  console.log(
    `[Audio] 音频已缓存: ${exerciseId}.mp3 (${(buffer.length / 1024).toFixed(0)} KB)`
  );
  return buffer;
}

export function getAvailableExerciseIds(): string[] {
  return EXERCISES.map((e) => e.id);
}

export function getExerciseMeta(exerciseId: string) {
  const e = EXERCISES.find((x) => x.id === exerciseId);
  if (!e) return null;
  return { id: e.id, name: e.name, emoji: e.emoji, brief: e.brief };
}

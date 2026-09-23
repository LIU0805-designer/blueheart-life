/**
 * 练习音频缓存层
 *
 * 首次请求时调用豆包 TTS（seed-tts-2.0，自然度更高）生成 MP3 并缓存到
 * public/audio/exercises/，后续请求直接读缓存。豆包失败时回退百度。
 */

import fs from "fs/promises";
import os from "os";
import path from "path";
import { generateBaiduSpeech } from "./baidu-tts";
import { generateDoubaoSpeech } from "./doubao-tts";
import { EXERCISES } from "@/lib/exercises";

// 缓存放临时目录（Vercel 等 serverless 平台文件系统只读，public/ 写不进去）
const CACHE_DIR = path.join(os.tmpdir(), "blueheart-audio", "exercises");

function getBaiduKeys() {
  return {
    apiKey: process.env.BAIDU_API_KEY || "",
    secretKey: process.env.BAIDU_SECRET_KEY || "",
  };
}

function getDoubaoKeys() {
  return {
    appId: process.env.DOUBAO_SPEECH_APPID || "",
    token: process.env.DOUBAO_SPEECH_TOKEN || "",
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

  console.log(
    `[Audio] 正在生成疗愈音频: ${exercise.name} (${exercise.script.length} 字符)`
  );

  let buffer: Buffer | undefined;

  // 优先豆包（音色更自然，适合疗愈引导），失败回退百度
  const doubao = getDoubaoKeys();
  if (doubao.appId && doubao.token) {
    try {
      buffer = await generateDoubaoSpeech(exercise.script, doubao);
    } catch (err) {
      console.warn("[Audio] 豆包练习音频生成失败，回退百度:", err);
    }
  }

  if (!buffer) {
    const { apiKey, secretKey } = getBaiduKeys();
    if (!apiKey || !secretKey) {
      throw new Error(
        "未配置语音服务。请在 .env 中设置 DOUBAO_SPEECH_APPID/TOKEN 或 BAIDU_API_KEY/SECRET_KEY"
      );
    }
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

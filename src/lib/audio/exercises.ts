/**
 * 练习音频缓存层
 *
 * 首次请求时调用百度 TTS 生成 MP3 并缓存到 public/audio/exercises/，
 * 后续请求直接读缓存。避免重复生成、加快响应。
 *
 * 注：练习引导脚本较长（数百字），豆包单次文本上限约 1024 字节且大模型音色
 * 需企业认证（个人账号用不了），故直接用百度 TTS（60KB 上限，足够）。
 */

import fs from "fs/promises";
import path from "path";
import { generateBaiduSpeech } from "./baidu-tts";
import { EXERCISES } from "@/lib/exercises";

const CACHE_DIR = path.join(process.cwd(), "public", "audio", "exercises");

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

  console.log(
    `[Audio] 正在生成疗愈音频: ${exercise.name} (${exercise.script.length} 字符)`
  );

  const { apiKey, secretKey } = getBaiduKeys();
  if (!apiKey || !secretKey) {
    throw new Error(
      "未配置百度 TTS。请在 .env 中设置 BAIDU_API_KEY + BAIDU_SECRET_KEY"
    );
  }

  const buffer = await generateBaiduSpeech(exercise.script, apiKey, secretKey);

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

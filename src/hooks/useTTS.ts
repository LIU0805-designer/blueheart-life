/**
 * useTTS — 浏览器语音合成 Hook
 *
 * 使用 Web Speech API（免费、无需 API Key）。
 * 自动选择系统最佳中文女声，根据情绪调整语速和音调。
 */
"use client";

import { useCallback, useRef, useState } from "react";
import {
  detectEmotion,
  EMOTION_RATE,
  EMOTION_PITCH,
  type EmotionResult,
} from "@/lib/ai/emotions";

interface SpeakOptions {
  text: string;
  messageId: string;
  onStart?: (emotion: EmotionResult) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /* ──── 获取最佳中文女声 ──── */
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();

    // 优先级：Microsoft Xiaoxiao Online > Xiaoxiao > 其他 zh-CN 女声 > 任意 zh-CN
    const xiaoxiao = voices.find(
      (v) => v.lang.startsWith("zh-CN") && v.name.includes("Xiaoxiao")
    );
    if (xiaoxiao) return xiaoxiao;

    const female = voices.find(
      (v) =>
        v.lang.startsWith("zh-CN") &&
        (v.name.includes("Female") || v.name.includes("女"))
    );
    if (female) return female;

    return voices.find((v) => v.lang.startsWith("zh-CN")) || null;
  }, []);

  /* ──── 确保声音列表已加载 ──── */
  const ensureVoices = useCallback(async (): Promise<
    SpeechSynthesisVoice[]
  > => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) return voices;

    return new Promise((resolve) => {
      const handler = () => {
        resolve(speechSynthesis.getVoices());
        speechSynthesis.removeEventListener("voiceschanged", handler);
      };
      speechSynthesis.addEventListener("voiceschanged", handler);
      speechSynthesis.getVoices(); // 触发加载
    });
  }, []);

  /* ──── 朗读 ──── */
  const speak = useCallback(
    async (opts: SpeakOptions) => {
      // 停止当前朗读
      speechSynthesis.cancel();

      await ensureVoices();
      const voice = getVoice();

      if (!voice) {
        opts.onError?.("未找到可用的中文语音引擎");
        return;
      }

      // 情绪检测
      const emotion = detectEmotion(opts.text);
      const rate = EMOTION_RATE[emotion.tone];
      const pitch = EMOTION_PITCH[emotion.tone];

      const utt = new SpeechSynthesisUtterance(opts.text);
      utt.voice = voice;
      utt.lang = "zh-CN";
      utt.rate = rate;
      utt.pitch = pitch;
      utt.volume = 1;

      utt.onstart = () => {
        setSpeaking(true);
        setSpeakingMessageId(opts.messageId);
        opts.onStart?.(emotion);
      };

      utt.onend = () => {
        setSpeaking(false);
        setSpeakingMessageId(null);
        utteranceRef.current = null;
        opts.onEnd?.();
      };

      utt.onerror = (e) => {
        // 用户主动取消不算错误
        if (e.error === "canceled" || e.error === "interrupted") {
          setSpeaking(false);
          setSpeakingMessageId(null);
          return;
        }
        setSpeaking(false);
        setSpeakingMessageId(null);
        utteranceRef.current = null;
        opts.onError?.(e.error || "播放出错");
      };

      utteranceRef.current = utt;
      speechSynthesis.speak(utt);
    },
    [ensureVoices, getVoice]
  );

  /* ──── 停止 ──── */
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakingMessageId(null);
    utteranceRef.current = null;
  }, []);

  return { speak, stop, speaking, speakingMessageId };
}

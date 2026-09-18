/**
 * useTTS — 聊天朗读 Hook
 *
 * 通过后端 TTS（豆包/百度）把消息合成 MP3 播放。
 * 不再用浏览器自带语音（Web Speech API）——手机上常无中文语音包或被禁用。
 */
"use client";

import { useCallback, useRef, useState } from "react";

interface SpeakOptions {
  text: string;
  messageId: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 请求序号：用于丢弃过期的朗读请求（用户快速切换播放时避免串音）
  const reqIdRef = useRef(0);

  /* ──── 停止播放 ──── */
  const stop = useCallback(() => {
    reqIdRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  /* ──── 朗读 ──── */
  const speak = useCallback(
    async (opts: SpeakOptions) => {
      // 停止当前播放并使旧请求失效
      audioRef.current?.pause();
      audioRef.current = null;
      const reqId = ++reqIdRef.current;

      setSpeaking(true);
      setSpeakingMessageId(opts.messageId);

      try {
        const res = await fetch("/api/audio/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: opts.text }),
        });

        // 已被更新的播放覆盖，丢弃本次结果
        if (reqId !== reqIdRef.current) return;

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          opts.onError?.(data?.error || "语音生成失败");
          setSpeaking(false);
          setSpeakingMessageId(null);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeaking(false);
          setSpeakingMessageId(null);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          opts.onEnd?.();
        };
        audio.onerror = () => {
          setSpeaking(false);
          setSpeakingMessageId(null);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          opts.onError?.("播放出错");
        };

        await audio.play();
      } catch (err: any) {
        setSpeaking(false);
        setSpeakingMessageId(null);
        audioRef.current = null;
        // 无用户手势被浏览器拦截（如自动朗读模式）——静默处理，不算错误
        if (err?.name !== "NotAllowedError") {
          opts.onError?.(err?.message || "播放出错");
        }
      }
    },
    []
  );

  return { speak, stop, speaking, speakingMessageId };
}

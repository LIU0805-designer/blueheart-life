"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import { useAmbientSound } from "@/components/shared/AmbientSoundContext";
import type { Exercise } from "@/lib/exercises";

interface Props {
  exercise: Exercise;
  /** 是否自动开始播放 */
  autoPlay?: boolean;
}

export default function MeditationPlayer({ exercise, autoPlay = false }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ambient = useAmbientSound();
  const ambientWasPlaying = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrl = `/api/audio/exercise/${exercise.id}`;

  /* 创建 Audio 实例（单次） */
  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio(audioUrl);
    audio.preload = "auto";

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setStatus("paused");
      setError(null);
      if (autoPlay) {
        audio.play().catch(() => setError("播放失败，请点击播放按钮"));
      }
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    const resumeAmbient = () => {
      if (ambientWasPlaying.current && !ambient.playing) {
        ambient.toggle();
        ambientWasPlaying.current = false;
      }
    };

    audio.addEventListener("ended", () => {
      setStatus("idle");
      setCurrentTime(0);
      resumeAmbient();
    });

    audio.addEventListener("error", () => {
      setError("音频加载失败，请稍后重试");
      setStatus("idle");
      resumeAmbient();
    });

    audioRef.current = audio;
    return audio;
  }, [audioUrl, autoPlay]);

  /* 加载音频 */
  useEffect(() => {
    if (status === "idle" && !audioRef.current) {
      setStatus("loading");
      const audio = ensureAudio();
      audio.load();
    }
  }, [status, ensureAudio]);

  const play = () => {
    const audio = ensureAudio();
    setError(null);

    // 冥想开始 → 暂停环境音
    if (ambient.playing) {
      ambient.toggle();
      ambientWasPlaying.current = true;
    }

    audio.play().then(() => setStatus("playing")).catch(() => {
      setError("播放失败，请点击播放按钮");
      // 播放失败也恢复环境音
      if (ambientWasPlaying.current) {
        ambientWasPlaying.current = false;
        if (!ambient.playing) ambient.toggle();
      }
    });
  };

  const pause = () => {
    audioRef.current?.pause();
    setStatus("paused");

    // 用户手动暂停 → 恢复环境音
    if (ambientWasPlaying.current && !ambient.playing) {
      ambient.toggle();
      ambientWasPlaying.current = false;
    }
  };

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (status === "playing") {
        audioRef.current.play();
      }
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/60 mt-3">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{exercise.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {exercise.name} · 疗愈引导
          </p>
          <p className="text-[11px] text-slate-400">
            {status === "loading"
              ? "正在加载音频..."
              : status === "playing"
              ? `${fmt(currentTime)} / ${fmt(duration)}`
              : duration > 0
              ? `时长 ${fmt(duration)} · 点击播放`
              : error || "准备就绪"}
          </p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-1 bg-blue-200/40 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{
            width: duration ? `${(currentTime / duration) * 100}%` : "0%",
          }}
        />
      </div>

      {/* 按钮 */}
      <div className="flex items-center gap-2">
        {status === "loading" ? (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-400 text-white text-sm font-medium cursor-wait"
          >
            <Loader2 size={16} className="animate-spin" />
            加载中...
          </button>
        ) : (
          <button
            onClick={status === "playing" ? pause : play}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors active:scale-[0.98]"
          >
            {status === "playing" ? (
              <>
                <Pause size={16} /> 暂停
              </>
            ) : (
              <>
                <Play size={16} /> {status === "paused" ? "继续" : "播放引导音频"}
              </>
            )}
          </button>
        )}

        <button
          onClick={reset}
          title="重新开始"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
    </div>
  );
}

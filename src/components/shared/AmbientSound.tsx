"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAmbientSound } from "./AmbientSoundContext";

interface Props {
  compact?: boolean;
}

/**
 * 环境音开关按钮。
 * 所有实例共享同一个 AudioContext，不管在哪里开关，状态都会同步。
 */
export default function AmbientSound({ compact }: Props) {
  const { playing, toggle } = useAmbientSound();

  return (
    <button
      onClick={toggle}
      title={playing ? "关闭环境音" : "开启环境音"}
      className={`inline-flex items-center gap-2 rounded-full text-sm font-medium transition-all duration-500 ${
        compact ? "p-2" : "px-4 py-2"
      } ${
        playing
          ? "bg-blue-100 text-blue-600 shadow-inner"
          : "bg-white/80 text-slate-400 hover:text-blue-500 hover:bg-blue-50 border border-slate-200"
      }`}
    >
      {playing ? (
        <>
          <Volume2 size={16} className="animate-pulse" />
          {!compact && <span>环境音 · 播放中</span>}
        </>
      ) : (
        <>
          <VolumeX size={16} />
          {!compact && <span>环境音 · 点击开启</span>}
        </>
      )}
    </button>
  );
}

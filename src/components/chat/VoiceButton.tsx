"use client";

import { Volume2, Square } from "lucide-react";

interface Props {
  onClick: () => void;
  isPlaying: boolean;
}

/**
 * 语音播放按钮 — 显示在 AI 消息气泡底部
 *
 * 播放中显示旋转音量图标 + "停止"；闲置显示音量图标 + "播放"
 */
export default function VoiceButton({ onClick, isPlaying }: Props) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        mt-2 inline-flex items-center gap-1.5 text-xs font-medium
        rounded-full px-2.5 py-1 transition-all duration-200
        ${
          isPlaying
            ? "bg-blue-100 text-blue-600"
            : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"
        }
      `}
      title={isPlaying ? "停止朗读" : "朗读这段"}
    >
      {isPlaying ? (
        <>
          <Volume2 size={13} className="animate-pulse" />
          <span>停止</span>
        </>
      ) : (
        <>
          <Volume2 size={13} />
          <span>播放</span>
        </>
      )}
    </button>
  );
}

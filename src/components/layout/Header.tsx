"use client";

import Link from "next/link";
import { Heart, MessageSquarePlus, Headphones, BookOpen } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useVoiceStore } from "@/stores/voice-store";
import AmbientSound from "@/components/shared/AmbientSound";

export default function Header() {
  const { newChat } = useChat();
  const { autoPlay, toggleAutoPlay } = useVoiceStore();

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-5 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <Heart
          size={22}
          className="text-blue-500 group-hover:text-blue-600 transition-colors"
          fill="currentColor"
        />
        <span className="text-lg font-semibold text-slate-800 tracking-tight">
          蓝心人生
        </span>
      </Link>

      {/* 操作 */}
      <div className="flex items-center gap-1.5">
        {/* 自动朗读 */}
        <button
          onClick={toggleAutoPlay}
          title={autoPlay ? "关闭自动朗读" : "开启自动朗读"}
          className={`
            p-2 rounded-full text-sm transition-all duration-200
            ${
              autoPlay
                ? "bg-blue-100 text-blue-600"
                : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"
            }
          `}
        >
          <Headphones size={16} />
        </button>

        <AmbientSound compact />

        {/* 情绪日记 */}
        <Link
          href="/journal"
          title="情绪日记"
          className="p-2 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <BookOpen size={16} />
        </Link>

        <button
          onClick={newChat}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <MessageSquarePlus size={16} />
          <span className="hidden sm:inline">新对话</span>
        </button>
      </div>
    </header>
  );
}

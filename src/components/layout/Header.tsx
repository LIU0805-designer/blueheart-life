"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  Heart,
  MessageSquarePlus,
  Headphones,
  BookOpen,
  PanelLeft,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useVoiceStore } from "@/stores/voice-store";
import { useAuth } from "@/hooks/useAuth";
import AmbientSound from "@/components/shared/AmbientSound";

interface HeaderProps {
  /** 传入时显示「收起/展开对话记录」按钮（仅聊天页） */
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { newChat } = useChat();
  const { autoPlay, toggleAutoPlay } = useVoiceStore();
  const { user, status, fetchMe, logout } = useAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-5 shrink-0">
      {/* 左侧：侧栏开关 + Logo */}
      <div className="flex items-center gap-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="收起/展开对话记录"
            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <PanelLeft size={18} />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Heart
            size={22}
            className="text-blue-500 group-hover:text-blue-600 transition-colors shrink-0"
            fill="currentColor"
          />
          <span className="text-lg font-semibold text-slate-800 tracking-tight whitespace-nowrap">
            蓝心人生
          </span>
        </Link>
      </div>

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

        {/* 疗愈练习 */}
        <Link
          href="/exercises"
          title="疗愈练习"
          className="p-2 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <Sparkles size={16} />
        </Link>

        {/* 情绪日记 */}
        <Link
          href="/journal"
          title="情绪日记"
          className="p-2 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <BookOpen size={16} />
        </Link>

        {/* 用户区 */}
        {status === "loading" ? null : status === "authed" ? (
          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-200">
            <span className="flex items-center gap-1.5 text-sm text-slate-600 px-2">
              <User size={15} className="text-blue-500" />
              <span className="max-w-[80px] truncate">{user?.username}</span>
            </span>
            <button
              onClick={logout}
              title="退出登录"
              className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-200">
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-blue-600 px-2 py-1.5 rounded-lg transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              注册
            </Link>
          </div>
        )}

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

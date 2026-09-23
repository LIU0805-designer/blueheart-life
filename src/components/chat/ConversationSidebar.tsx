"use client";

import { useEffect, useCallback } from "react";
import { MessageSquarePlus, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";

/**
 * 把时间戳格式化成相对时间：刚刚 / X 分钟前 / X 小时前 / 昨天 / X 天前 / 日期
 */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "昨天";
  if (day < 7) return `${day} 天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConversationSidebar({ open, onClose }: Props) {
  const {
    conversations,
    conversationId,
    loadConversations,
    loadHistory,
    newChat,
  } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelect = useCallback(
    (id: string) => {
      loadHistory(id);
      onClose();
    },
    [loadHistory, onClose]
  );

  const handleNew = useCallback(() => {
    newChat();
    onClose();
  }, [newChat, onClose]);

  const content = (
    <>
      {/* 新对话 */}
      <div className="p-3">
        <button
          onClick={handleNew}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          <MessageSquarePlus size={16} />
          新对话
        </button>
      </div>

      {/* 对话列表 */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed px-4">
            还没有对话记录
            <br />
            开始和蓝心聊聊吧
          </p>
        )}

        {conversations.map((c) => {
          const active = c.id === conversationId;
          return (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex-1 truncate text-[13px] font-medium">
                  {c.title || "新的对话"}
                </span>
                {c.crisisFlag && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"
                    title="含危机内容"
                  />
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {formatTime(c.updatedAt)}
              </div>
            </button>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* 桌面端：内联侧栏，宽度折叠 */}
      <aside
        className={`hidden md:flex flex-col shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out bg-white ${
          open ? "border-r border-slate-200" : ""
        }`}
        style={{ width: open ? 280 : 0 }}
      >
        {content}
      </aside>

      {/* 移动端：抽屉 + 遮罩 */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-slate-900/30 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white flex flex-col transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700 px-1">
              对话记录
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
          {content}
        </aside>
      </div>
    </>
  );
}

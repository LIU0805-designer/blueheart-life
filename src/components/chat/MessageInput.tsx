"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBehaviorMonitor } from "@/hooks/useBehaviorMonitor";
import { useChatStore } from "@/stores/chat-store";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setInputBehavior = useChatStore((s) => s.setInputBehavior);

  /* ── 行为监听 ── */
  const { behavior, onTextChange, onSend: onBehaviorSend } =
    useBehaviorMonitor({
      hesitationThreshold: 4000,
      heartbeatInterval: 1200,
    });

  // 行为信号同步到全局 store
  useEffect(() => {
    setInputBehavior({
      hesitating: behavior.hesitating,
      hasRewritten: behavior.rewritten,
      hasAbandoned: behavior.abandoned,
    });
  }, [behavior.hesitating, behavior.rewritten, behavior.abandoned, setInputBehavior]);

  // 自动调整高度
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    }
  }, [text]);

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      onTextChange(value);
    },
    [onTextChange]
  );

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    onBehaviorSend();
    setText("");
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 犹豫时的占位符文本
  const placeholderText = behavior.hesitating
    ? "不着急，慢慢想……"
    : "在这里写下你想说的话……";

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            disabled={disabled}
            className={`w-full resize-none rounded-xl border px-4 py-3 text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 transition-all duration-500 ${
              behavior.hesitating
                ? "border-blue-200 bg-blue-50/50 focus:ring-blue-300"
                : "border-slate-200 bg-slate-50 focus:ring-blue-400"
            }`}
          />

          {/* 犹豫指示器 — 输入框右下角的小光点 */}
          <AnimatePresence>
            {behavior.hesitating && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-3 bottom-3 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[11px] text-blue-400/70 select-none">
                  在听
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  );
}

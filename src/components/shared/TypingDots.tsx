"use client";

import { motion } from "framer-motion";

/**
 * 打字指示器 — AI 正在输入中的跳动小点
 */
export default function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-5 py-3.5">
      <span className="text-xs text-slate-400 mr-1">蓝心正在输入</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-2 h-2 rounded-full bg-blue-400"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

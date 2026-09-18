"use client";

import { motion } from "framer-motion";

/**
 * 呼吸光圈 — 两种模式
 *
 * idle: 背景氛围，缓慢呼吸（和之前一样）
 * breathing: 呼吸练习引导，放大 + 明确节奏（吸气4s / 屏息2s / 呼气6s）
 */

interface Props {
  /** 练习模式开关 */
  active?: boolean;
  /** 呼吸阶段 */
  phase?: "inhale" | "hold" | "exhale";
}

export default function BreathingCircle({
  active = false,
  phase = "inhale",
}: Props) {
  /* ── 呼吸练习模式 ── */
  if (active) {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        {/* 外层光晕 — 12秒完整呼吸周期 */}
        <motion.div
          className="rounded-full bg-blue-400"
          style={{ width: 260, height: 260, filter: "blur(50px)" }}
          animate={{
            scale: phase === "inhale" ? 1.4 : phase === "hold" ? 1.4 : 1.0,
            opacity: phase === "inhale" ? 0.55 : phase === "hold" ? 0.5 : 0.25,
          }}
          transition={{
            scale: {
              duration: phase === "inhale" ? 4 : phase === "hold" ? 2 : 6,
              ease: "easeInOut" as const,
            },
            opacity: {
              duration: phase === "inhale" ? 4 : phase === "hold" ? 2 : 6,
              ease: "easeInOut" as const,
            },
          }}
        />

        {/* 中层 — 主要视觉引导 */}
        <motion.div
          className="absolute rounded-full bg-blue-300"
          style={{ width: 200, height: 200, filter: "blur(40px)" }}
          animate={{
            scale: phase === "inhale" ? 1.6 : phase === "hold" ? 1.6 : 1.0,
            opacity: phase === "inhale" ? 0.7 : phase === "hold" ? 0.65 : 0.3,
          }}
          transition={{
            scale: {
              duration: phase === "inhale" ? 4 : phase === "hold" ? 2 : 6,
              ease: "easeInOut" as const,
            },
            opacity: {
              duration: phase === "inhale" ? 4 : phase === "hold" ? 2 : 6,
              ease: "easeInOut" as const,
            },
          }}
        />

        {/* 内核 — 最亮 */}
        <motion.div
          className="absolute rounded-full bg-blue-200"
          style={{ width: 120, height: 120, filter: "blur(25px)" }}
          animate={{
            scale: phase === "inhale" ? 1.8 : phase === "hold" ? 1.8 : 1.0,
            opacity: phase === "inhale" ? 0.9 : phase === "hold" ? 0.85 : 0.4,
          }}
          transition={{
            scale: {
              duration: phase === "inhale" ? 4 : phase === "hold" ? 2 : 6,
              ease: "easeInOut" as const,
            },
            opacity: {
              duration: phase === "inhale" ? 4 : phase === "hold" ? 2 : 6,
              ease: "easeInOut" as const,
            },
          }}
        />
      </div>
    );
  }

  /* ── 默认氛围模式 ── */
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
      <motion.div
        className="rounded-full bg-blue-400"
        style={{ width: 200, height: 200, filter: "blur(60px)" }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      />
      <motion.div
        className="absolute rounded-full bg-blue-300"
        style={{ width: 300, height: 300, filter: "blur(80px)" }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
      />
    </div>
  );
}

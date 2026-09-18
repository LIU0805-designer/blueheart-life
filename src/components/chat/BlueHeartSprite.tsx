"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { EmotionTone } from "@/lib/ai/emotions";

/* ──── 类型 ──── */

export type SpriteState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "concerned";

interface Props {
  state: SpriteState;
  emotion?: EmotionTone;
}

/* ──── 情绪 → 光晕颜色 ──── */

function getGlowColor(emotion: EmotionTone): string {
  switch (emotion) {
    case "warm":
    case "light":
      return "rgba(96,165,250,0.5)";
    case "gentle":
      return "rgba(147,197,253,0.5)";
    case "thoughtful":
      return "rgba(129,140,248,0.5)";
    case "concerned":
    case "firm":
      return "rgba(99,102,241,0.5)";
    default:
      return "rgba(125,211,252,0.5)";
  }
}

/* ──── 动画速度 ──── */

function spdMul(emotion: EmotionTone): number {
  const map: Record<string, number> = {
    gentle: 0.85, warm: 1.0, calm: 0.9, thoughtful: 0.7,
    concerned: 0.6, firm: 0.9, light: 1.15,
  };
  return map[emotion] ?? 0.9;
}

/* ──── 状态 → 中文提示语 ──── */

const STATUS_MESSAGES: Record<SpriteState, string[]> = {
  idle: [
    "我在这里，你想说什么都可以。",
    "这里很安静，只有你和我。",
    "不着急，按你的节奏来就好。",
    "累了就停一会儿，没关系的。",
  ],
  listening: [
    "嗯，我在认真听……",
    "慢慢说，不急。",
    "我在呢，你继续说。",
    "你说的每一句话，我都有在听。",
  ],
  thinking: [
    "让我想想……",
    "我在想你说的话……",
    "嗯，这里好像有些重要的东西。",
    "等一下，让我好好理解一下。",
  ],
  speaking: [
    "我想说的是……",
    "听完你的话，我有一些感受想分享。",
    "谢谢你愿意告诉我这些。",
    "有些话想说给你听……",
  ],
  concerned: [
    "你还好吗？我很在意你现在的状态。",
    "听起来这真的很不容易。",
    "我在认真地、专注地陪着你。",
    "不要一个人扛着，好吗？",
  ],
};

function getRandomMessage(state: SpriteState): string {
  const messages = STATUS_MESSAGES[state];
  return messages[Math.floor(Math.random() * messages.length)];
}

/* ═══════════════════════════════════════
   蓝心精灵（新版：Seedream 生成形象）
   ═══════════════════════════════════════ */

export default function BlueHeartSprite({
  state,
  emotion = "calm",
}: Props) {
  const glowColor = getGlowColor(emotion);
  const spd = spdMul(emotion);

  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");

  const handleClick = useCallback(() => {
    const msg = getRandomMessage(state);
    setBubbleMessage(msg);
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 3000);
  }, [state]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {/* 点击气泡 */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white border border-blue-200 rounded-2xl px-4 py-2.5 shadow-lg shadow-blue-100/50 z-20 whitespace-nowrap"
          >
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-blue-200 rotate-45" />
            <p className="text-[13px] text-slate-600 leading-relaxed">
              {bubbleMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative cursor-pointer select-none"
        animate={containerAnim(state, spd)}
        onClick={handleClick}
        title="点我一下"
      >
        {/* 情绪光晕 */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          animate={{
            boxShadow: `0 0 30px 8px ${glowColor}`,
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            opacity: { duration: 3 / spd, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* 角色头像 */}
        <div className="relative w-[85px] h-[85px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden ring-2 ring-white/80 shadow-lg shadow-blue-200/40">
          <Image
            src="/images/blueheart-avatar.png"
            alt="蓝心"
            width={1920}
            height={1920}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ──── 外层容器动画 ──── */

function containerAnim(state: SpriteState, spd: number) {
  switch (state) {
    case "idle":
      return {
        y: [0, -6, 0],
        scale: [1, 1.04, 1],
        transition: {
          y: { duration: 4.5 / spd, repeat: Infinity, ease: "easeInOut" as const },
          scale: { duration: 5.5 / spd, repeat: Infinity, ease: "easeInOut" as const },
        },
      };
    case "listening":
      return {
        y: [0, -3, 0],
        x: 5,
        transition: {
          y: { duration: 2.5 / spd, repeat: Infinity, ease: "easeInOut" as const },
          x: { duration: 0.5, ease: "easeOut" as const },
        },
      };
    case "thinking":
      return {
        y: [0, -2, 0],
        rotate: [-3, 5, -3],
        transition: {
          y: { duration: 4 / spd, repeat: Infinity, ease: "easeInOut" as const },
          rotate: { duration: 3.5 / spd, repeat: Infinity, ease: "easeInOut" as const },
        },
      };
    case "speaking":
      return {
        y: [0, -7, 0, -3, 0, -5, 0],
        transition: {
          y: {
            duration: 2 / spd,
            times: [0, 0.16, 0.33, 0.5, 0.66, 0.83, 1],
            ease: "easeInOut" as const,
            repeat: Infinity,
          },
        },
      };
    case "concerned":
      return {
        y: [0, -2, 0],
        scale: 0.92,
        transition: {
          y: { duration: 7 / spd, repeat: Infinity, ease: "easeInOut" as const },
          scale: { duration: 1, ease: "easeOut" as const },
        },
      };
  }
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import AuthGuard from "@/components/auth/AuthGuard";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

/* ──── 情绪日记条目类型 ──── */

interface EmotionItem {
  name: string;
  intensity: number;
}

interface JournalEntry {
  id: string;
  conversationId: string;
  mood: "positive" | "neutral" | "negative" | "mixed";
  emotions: EmotionItem[];
  summary: string;
  highlights: string[];
  createdAt: string;
}

/* ──── 情绪色调映射 ──── */

const MOOD_CONFIG: Record<
  string,
  { emoji: string; label: string; bg: string; text: string; ring: string }
> = {
  positive: {
    emoji: "😊",
    label: "晴朗",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  neutral: {
    emoji: "😐",
    label: "平静",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
  },
  negative: {
    emoji: "😔",
    label: "阴雨",
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
  },
  mixed: {
    emoji: "🎭",
    label: "交织",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
};

/* ──── 情绪强度颜色 ──── */

function intensityColor(n: number): string {
  if (n >= 7) return "bg-red-300";
  if (n >= 5) return "bg-orange-300";
  if (n >= 3) return "bg-yellow-300";
  return "bg-blue-200";
}

/* ═══════════════════════════════════════
   情绪日记页面
   ═══════════════════════════════════════ */

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <div className="h-dvh flex flex-col">
        <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <Link
              href="/chat"
              className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <BookOpen size={22} className="text-blue-500" />
            <h1 className="text-xl font-semibold text-slate-700">情绪日记</h1>
          </motion.div>

          {/* 加载中 */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
          )}

          {/* 空状态 */}
          {!loading && entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-5xl mb-4">📖</div>
              <p className="text-slate-500 mb-2">还没有情绪日记</p>
              <p className="text-sm text-slate-400">
                去和蓝心聊一会儿，聊天结束后可以保存日记
              </p>
              <Link
                href="/chat"
                className="inline-block mt-6 text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                → 去聊聊天
              </Link>
            </motion.div>
          )}

          {/* 日记列表 */}
          <div className="space-y-5">
            {entries.map((entry, idx) => {
              const cfg = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.neutral;
              const date = new Date(entry.createdAt);
              const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  className={`${cfg.bg} rounded-2xl p-5 ring-1 ${cfg.ring}`}
                >
                  {/* 头部：日期 + 心情 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] text-slate-500">{dateStr}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${cfg.text}`}
                    >
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>

                  {/* 摘要 */}
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-4">
                    {entry.summary}
                  </p>

                  {/* 情绪标签 */}
                  {entry.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {entry.emotions.map((em) => (
                        <span
                          key={em.name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] bg-white/60 text-slate-600"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${intensityColor(em.intensity)}`}
                          />
                          {em.name}
                          <span className="text-[11px] text-slate-400">
                            {em.intensity}/10
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 原句摘录 */}
                  {entry.highlights.length > 0 && (
                    <div className="border-t border-white/50 pt-3 mt-2">
                      {entry.highlights.map((h, i) => (
                        <p
                          key={i}
                          className="text-[13px] text-slate-500 italic leading-relaxed mb-1"
                        >
                          「{h}」
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}

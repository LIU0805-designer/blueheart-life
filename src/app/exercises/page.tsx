"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import { ArrowLeft, Sparkles } from "lucide-react";
import { EXERCISES } from "@/lib/exercises";
import MeditationPlayer from "@/components/exercise/MeditationPlayer";

export default function ExercisesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = EXERCISES.find((e) => e.id === activeId) || null;

  return (
    <div className="h-dvh flex flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <Link
              href="/chat"
              className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <Sparkles size={22} className="text-blue-500" />
            <h1 className="text-xl font-semibold text-slate-700">疗愈练习</h1>
          </motion.div>

          <p className="text-sm text-slate-400 mb-8 ml-10">
            不用聊天，直接开始。选一个此刻最需要的吧。
          </p>

          {/* 卡片网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXERCISES.map((ex, idx) => {
              const isActive = ex.id === activeId;
              return (
                <motion.button
                  key={ex.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.35 }}
                  onClick={() =>
                    setActiveId((prev) => (prev === ex.id ? null : ex.id))
                  }
                  className={`
                    text-left rounded-2xl p-5 border transition-all duration-200
                    ${
                      isActive
                        ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-200"
                        : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100/50"
                    }
                  `}
                >
                  <span className="text-3xl">{ex.emoji}</span>
                  <h3 className="text-[15px] font-semibold text-slate-700 mt-3 mb-1">
                    {ex.name}
                  </h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    {ex.brief}
                  </p>
                  <span
                    className={`inline-block mt-3 text-[12px] font-medium ${
                      isActive ? "text-blue-400" : "text-blue-500"
                    }`}
                  >
                    {isActive ? "点击收起 ↑" : "开始练习 →"}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* 选中的练习 → 播放器 */}
          <AnimatePresence>
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-6">
                  <MeditationPlayer exercise={active} autoPlay />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

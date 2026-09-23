"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Shield, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import AmbientSound from "@/components/shared/AmbientSound";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="max-w-lg w-full text-center">
          {/* 主视觉：蓝心头像（柔和光晕 + 呼吸浮动） */}
          <motion.div
            className="relative mb-8 flex justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute w-40 h-40 rounded-full bg-blue-200/60 blur-2xl" />
            <Image
              src="/images/blueheart-avatar.png"
              alt="蓝心"
              width={144}
              height={144}
              className="relative w-36 h-36 rounded-full object-cover ring-4 ring-white shadow-xl shadow-blue-200/60"
              priority
            />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
            蓝心人生
          </h1>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            一个 24 小时在线的 AI 心理陪伴者
            <br />
            陪你走过人生的难走之路
          </p>

          {/* 进入按钮 */}
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-2.5 bg-blue-500 text-white text-lg font-medium px-8 py-3.5 rounded-2xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98]"
          >
            <MessageCircle size={22} />
            开始对话
          </button>

          {/* 环境音 */}
          <div className="mt-6">
            <AmbientSound />
          </div>

          {/* 特点卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14">
            {[
              {
                icon: Shield,
                title: "安全私密",
                desc: "你说的话只在你和蓝心之间",
              },
              {
                icon: Sparkles,
                title: "专业温暖",
                desc: "四大知识体系支撑回应质量",
              },
              {
                icon: Heart,
                title: "随时陪伴",
                desc: "深夜、清晨、任何你需要的时候",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl px-4 py-5 border border-slate-100 text-center"
              >
                <Icon size={22} className="text-blue-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700 mb-1">
                  {title}
                </h3>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="py-4 text-center text-xs text-slate-400">
        蓝心是 AI 陪伴者，不替代专业心理治疗。如有紧急情况，请拨打希望24热线：400-161-9995
      </footer>
    </div>
  );
}

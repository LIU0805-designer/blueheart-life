"use client";

import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useTTS } from "@/hooks/useTTS";
import { useVoiceStore } from "@/stores/voice-store";
import { useChatStore } from "@/stores/chat-store";
import { detectEmotion } from "@/lib/ai/emotions";
import type { EmotionTone } from "@/lib/ai/emotions";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import CrisisBanner from "./CrisisBanner";
import BlueHeartSprite from "./BlueHeartSprite";
import type { SpriteState } from "./BlueHeartSprite";
import BreathingCircle from "@/components/shared/BreathingCircle";
import FloatingOrbs from "@/components/shared/FloatingOrbs";
import TypingDots from "@/components/shared/TypingDots";
import MeditationPlayer from "@/components/exercise/MeditationPlayer";
import { detectExercise } from "@/lib/audio/detect-exercise";

/**
 * 根据时间段返回不同的欢迎语
 */
function getGreeting(): { emoji: string; title: string; subtitle: string } {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 9) {
    return {
      emoji: "🌅",
      title: "早安",
      subtitle: "新的一天开始了。不着急，慢慢来，你想从哪里开始？",
    };
  }
  if (hour >= 9 && hour < 12) {
    return {
      emoji: "💙",
      title: "你好，我是蓝心",
      subtitle: "这里是一个安全的空间。你想说什么都可以，按你舒服的节奏来就好。",
    };
  }
  if (hour >= 12 && hour < 14) {
    return {
      emoji: "☀️",
      title: "午后好",
      subtitle: "一天的中点，给自己一个停下来喘息的时刻吧。",
    };
  }
  if (hour >= 14 && hour < 18) {
    return {
      emoji: "🍃",
      title: "下午好",
      subtitle: "下午的光很温柔。泡杯茶，慢慢聊。",
    };
  }
  if (hour >= 18 && hour < 22) {
    return {
      emoji: "🌙",
      title: "晚上好",
      subtitle: "白天的喧嚣退去了。这里很安静，只有你和我。",
    };
  }
  // 深夜 22:00 - 5:00
  return {
    emoji: "✨",
    title: "夜深了",
    subtitle: "这个时间还醒着的人，心里大概装着些什么。不用担心打扰谁，我在这里。",
  };
}

export default function ChatContainer() {
  const {
    messages,
    isStreaming,
    crisisDetected,
    crisisKeywords,
    userBehavior,
    conversationId,
    sendMessage,
    clearCrisis,
  } = useChat();

  const { speak, stop, speaking, speakingMessageId } = useTTS();
  const autoPlay = useVoiceStore((s) => s.autoPlay);

  const bottomRef = useRef<HTMLDivElement>(null);
  const greeting = useMemo(() => getGreeting(), []);
  const lastAutoPlayedId = useRef<string | null>(null);

  /* ──── 蓝心精灵 状态推导 ──── */

  const [speakingTimer, setSpeakingTimer] = useState(false);
  const [concernedTimer, setConcernedTimer] = useState(false);
  const prevStreaming = useRef(isStreaming);
  const prevMessageCount2 = useRef(messages.length);
  // 跟踪输入行为中的犹豫状态
  const inputHesitating = useChatStore((s) => s.userBehavior.inputBehavior.hesitating);

  // 监听流式结束 → 切换到「说话」状态，持续 4 秒
  useEffect(() => {
    if (prevStreaming.current && !isStreaming && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        setSpeakingTimer(true);
        const t = setTimeout(() => setSpeakingTimer(false), 4000);
        return () => clearTimeout(t);
      }
    }
    prevStreaming.current = isStreaming;
  }, [isStreaming, messages]);

  // 监听用户发送极简回复 → 「关切」状态，持续 5 秒
  useEffect(() => {
    if (messages.length > prevMessageCount2.current) {
      const lastMsg = messages[messages.length - 1];
      if (
        lastMsg.role === "user" &&
        lastMsg.minimalResponse &&
        lastMsg.minimalResponse.intensity === "high"
      ) {
        setConcernedTimer(true);
        const t = setTimeout(() => setConcernedTimer(false), 5000);
        prevMessageCount2.current = messages.length;
        return () => clearTimeout(t);
      }
    }
    prevMessageCount2.current = messages.length;
  }, [messages]);

  const spriteState = useMemo((): SpriteState => {
    if (crisisDetected) return "concerned";
    if (isStreaming) return "thinking";
    if (speakingTimer) return "speaking";
    // 用户发来极简回复 → 关切
    if (concernedTimer) return "concerned";
    if (messages.length === 0) return "idle";

    const lastMsg = messages[messages.length - 1];
    // 用户正在输入中（犹豫）→ 保持倾听
    if (inputHesitating) return "listening";
    if (lastMsg.role === "user") return "listening";

    // 消息趋势缩短 → 轻度关切
    if (userBehavior.messageTrend === "shortening") return "concerned";

    return "idle";
  }, [messages, isStreaming, crisisDetected, speakingTimer, concernedTimer, inputHesitating, userBehavior.messageTrend]);

  // 从最新 AI 消息中检测情绪
  const spriteEmotion = useMemo((): EmotionTone => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        return detectEmotion(messages[i].content).tone;
      }
    }
    return "calm";
  }, [messages]);

  // 检测 AI 正在引导哪个练习
  const activeExercise = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && !messages[i].isStreaming) {
        const ex = detectExercise(messages[i].content);
        if (ex) return ex;
      }
    }
    return null;
  }, [messages]);

  // 检测呼吸练习模式
  const breathingActive = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        const text = messages[i].content;
        return (
          text.includes("吸气") ||
          text.includes("慢慢地呼气") ||
          text.includes("聚焦呼吸") ||
          text.includes("呼吸练习") ||
          text.includes("呼吸空间") ||
          (text.includes("呼吸") && text.includes("闭上眼睛"))
        );
      }
    }
    return false;
  }, [messages]);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动朗读：当新 AI 消息完成且开启了自动播放
  useEffect(() => {
    if (!autoPlay) return;
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // 条件：最新是 AI 消息 + 已完成（不在流中）+ 还没播放过
    if (
      lastMsg.role === "assistant" &&
      !lastMsg.isStreaming &&
      !isStreaming &&
      lastMsg.id !== lastAutoPlayedId.current
    ) {
      lastAutoPlayedId.current = lastMsg.id;
      speak({
        text: lastMsg.content,
        messageId: lastMsg.id,
        onError: (err) => console.warn("TTS 自动播放失败:", err),
      });
    }
  }, [messages, isStreaming, autoPlay, speak]);

  /* ──── 保存情绪日记 ──── */

  const [savingJournal, setSavingJournal] = useState(false);
  const [journalSaved, setJournalSaved] = useState(false);

  const handleSaveJournal = useCallback(async () => {
    if (!conversationId || savingJournal) return;
    setSavingJournal(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      if (res.ok) {
        setJournalSaved(true);
        setTimeout(() => setJournalSaved(false), 3000);
      }
    } catch (e) {
      console.error("保存日记失败:", e);
    } finally {
      setSavingJournal(false);
    }
  }, [conversationId, savingJournal]);

  // 手动播放/停止
  const handlePlayVoice = useCallback(
    (messageId: string) => {
      // 如果正在播放同一条消息，停止
      if (speaking && speakingMessageId === messageId) {
        stop();
        return;
      }

      const msg = messages.find((m) => m.id === messageId);
      if (!msg || msg.role !== "assistant") return;

      speak({
        text: msg.content,
        messageId: msg.id,
        onError: (err) => console.warn("TTS 播放失败:", err),
      });
    },
    [speak, stop, speaking, speakingMessageId, messages]
  );

  return (
    <div className="flex h-full relative">
      {/* 漂浮光晕粒子 */}
      <FloatingOrbs />

      {/* 呼吸光圈 — 检测到呼吸练习时自动放大 */}
      <BreathingCircle active={breathingActive} />

      {/* ════ 左侧栏：蓝心精灵 ════ */}
      <aside className="hidden sm:flex w-[100px] lg:w-[120px] shrink-0 flex-col items-center justify-center relative z-10 border-r border-blue-100/50 bg-gradient-to-b from-blue-50/40 to-white">
        <BlueHeartSprite state={spriteState} emotion={spriteEmotion} />
        <span className="text-[11px] text-blue-400/70 font-medium mt-1 tracking-wider">
          蓝心
        </span>
      </aside>

      {/* ════ 右侧：聊天区 ════ */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        {/* 危机横幅 */}
        {crisisDetected && (
          <CrisisBanner keywords={crisisKeywords} onDismiss={clearCrisis} />
        )}

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {/* 保存日记按钮 — 有消息时出现 */}
            {messages.length > 0 && conversationId && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleSaveJournal}
                  disabled={savingJournal || journalSaved}
                  className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full transition-all duration-200 ${
                    journalSaved
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                  }`}
                >
                  {savingJournal ? (
                    <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : journalSaved ? (
                    <span>✓ 已保存</span>
                  ) : (
                    <>
                      <span>📖</span>
                      <span>保存日记</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center py-20"
              >
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {greeting.emoji}
                </motion.div>
                <h2 className="text-2xl font-medium text-slate-700 mb-2">
                  {greeting.title}
                </h2>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {greeting.subtitle}
                </p>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <MessageBubble
                    message={msg}
                    onPlayVoice={handlePlayVoice}
                    playingVoiceId={speakingMessageId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 打字指示器 */}
            {isStreaming && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4"
              >
                <TypingDots />
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* 疗愈练习引导音频播放器 */}
        {activeExercise && (
          <div className="px-4 pb-2">
            <div className="max-w-3xl mx-auto">
              <MeditationPlayer exercise={activeExercise} />
            </div>
          </div>
        )}

        {/* 输入区域 */}
        <div>
          <MessageInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}

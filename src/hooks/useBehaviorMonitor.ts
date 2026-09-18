/**
 * useBehaviorMonitor — 监听用户在输入框中的行为信号
 *
 * 不记录具体输入内容，只记录行为模式：
 * - 打字节奏（是否长时间停顿）
 * - 反复修改（删除重写）
 * - 放弃输入（打字后清空未发送）
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { InputBehavior } from "@/lib/ai/behavior-signals";
import { evaluateInputBehavior } from "@/lib/ai/behavior-signals";

interface BehaviorMonitorOptions {
  /** 多久没有编辑操作算"犹豫"（毫秒），默认 5000 */
  hesitationThreshold?: number;
  /** 心跳间隔（毫秒），默认 1500 */
  heartbeatInterval?: number;
}

export function useBehaviorMonitor(opts: BehaviorMonitorOptions = {}) {
  const { hesitationThreshold = 5000, heartbeatInterval = 1500 } = opts;

  /* ── 持久计数器（跨输入会话）── */
  const rewriteCountRef = useRef(0);
  const abandonedCountRef = useRef(0);
  const lastTextLengthRef = useRef(0);

  /* ── 当前输入会话状态 ── */
  const [currentText, setCurrentText] = useState("");
  const lastEditTimeRef = useRef(Date.now());
  const sessionStartRef = useRef<number | null>(null);
  const hasTypedRef = useRef(false);

  /* ── 行为快照 ── */
  const [behavior, setBehavior] = useState<InputBehavior>({
    hesitating: false,
    rewritten: false,
    abandoned: false,
    pauseSeconds: 0,
  });

  /* ── 心跳：定时刷新 pauseSeconds ── */
  useEffect(() => {
    const timer = setInterval(() => {
      const pauseSeconds = Math.round(
        (Date.now() - lastEditTimeRef.current) / 1000
      );
      setBehavior((prev) => ({
        ...prev,
        hesitating:
          currentText.length > 0 && pauseSeconds >= hesitationThreshold / 1000,
        pauseSeconds,
        rewritten: rewriteCountRef.current >= 2,
        abandoned: abandonedCountRef.current > 0,
      }));
    }, heartbeatInterval);

    return () => clearInterval(timer);
  }, [currentText, heartbeatInterval, hesitationThreshold]);

  /* ── 文本变化时调用 ── */
  const onTextChange = useCallback(
    (newText: string) => {
      const prevLen = lastTextLengthRef.current;
      const newLen = newText.length;

      // 开始输入
      if (prevLen === 0 && newLen > 0) {
        sessionStartRef.current = Date.now();
        hasTypedRef.current = true;
      }

      // 检测大幅度回删（>5 字符的缩减）→ 计为"重写"
      if (prevLen - newLen > 5) {
        rewriteCountRef.current += 1;
      }

      // 检测放弃输入：之前打了不少内容（>10字），现在清空了
      if (newLen === 0 && prevLen > 10 && hasTypedRef.current) {
        abandonedCountRef.current += 1;
      }

      lastTextLengthRef.current = newLen;
      lastEditTimeRef.current = Date.now();
      setCurrentText(newText);
    },
    []
  );

  /* ── 发送消息时调用 ── */
  const onSend = useCallback(() => {
    // 重置当前输入会话
    sessionStartRef.current = null;
    hasTypedRef.current = false;
    lastTextLengthRef.current = 0;
    rewriteCountRef.current = 0;
    lastEditTimeRef.current = Date.now();
    setCurrentText("");

    setBehavior({
      hesitating: false,
      rewritten: false,
      abandoned: false,
      pauseSeconds: 0,
    });
  }, []);

  /* ── 获取当前完整行为快照 ── */
  const getSnapshot = useCallback((): InputBehavior => {
    return evaluateInputBehavior({
      hasText: currentText.length > 0,
      textLength: currentText.length,
      pauseSeconds: Math.round(
        (Date.now() - lastEditTimeRef.current) / 1000
      ),
      rewriteCount: rewriteCountRef.current,
      abandonedThisSession: abandonedCountRef.current > 0,
    });
  }, [currentText]);

  return {
    /** 当前行为状态（心跳自动更新） */
    behavior,
    /** 输入文本改变时调用 */
    onTextChange,
    /** 消息发送时调用 */
    onSend,
    /** 获取即时快照（需要精确值时用） */
    getSnapshot,
    /** 本输入会话中是否有过放弃行为 */
    hasAbandoned: abandonedCountRef.current > 0,
    /** 本输入会话中是否有过反复重写 */
    hasRewritten: rewriteCountRef.current >= 2,
  };
}

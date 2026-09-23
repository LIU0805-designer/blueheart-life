/**
 * useChat — 聊天逻辑 hook
 * 处理消息发送、流式接收、状态同步
 */
"use client";

import { useCallback, useRef } from "react";
import { useChatStore, ChatMessage } from "@/stores/chat-store";
import { detectCrisisKeywords } from "@/lib/ai/crisis-detector";

export function useChat() {
  const store = useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  // 拉取对话列表（用 getState 直写，保持回调稳定，避免 setState 触发自身重建）
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        useChatStore.setState({ conversations: data.conversations || [] });
      }
    } catch {
      console.error("加载对话列表失败");
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || store.isStreaming) return;

      // 危机检测
      const crisis = detectCrisisKeywords(text);
      if (crisis.isCrisis) {
        store.setCrisis(crisis.keywords);
      }

      // 添加用户消息
      const userMsg: ChatMessage = {
        id: "user-" + Date.now(),
        role: "user",
        content: text,
      };
      store.addMessage(userMsg);

      // 读取最新的用户行为信号（addMessage 已同步更新极简回复/消息趋势）
      const behaviorSnapshot = useChatStore.getState().userBehavior;

      store.setStreaming(true);

      // 添加空的 AI 回复占位
      const assistantId = "ai-" + Date.now();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            ...(store.conversationId ? { conversationId: store.conversationId } : {}),
            behavior: {
              lastMinimalResponse: behaviorSnapshot.lastMinimalResponse,
              messageTrend: behaviorSnapshot.messageTrend,
              inputBehavior: behaviorSnapshot.inputBehavior,
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          store.addMessage({
            id: assistantId,
            role: "assistant",
            content: `抱歉，${err.error || "出现了一些问题，请稍后重试。"}`,
          });
          store.setStreaming(false);
          return;
        }

        // 处理 SSE 流
        const reader = res.body?.getReader();
        if (!reader) {
          store.setStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let streamStarted = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]")
              continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                if (!streamStarted) {
                  store.addMessage({
                    id: assistantId,
                    role: "assistant",
                    content: data.text,
                    isStreaming: true,
                  });
                  streamStarted = true;
                } else {
                  store.appendToLastAssistant(data.text);
                }
              } else if (data.type === "done") {
                store.setConversationId(data.conversationId);
                // 标记流式完成
                store.setStreaming(false);
                // 新对话标题已生成 → 刷新侧边栏列表
                void loadConversations();
              } else if (data.type === "error") {
                store.addMessage({
                  id: assistantId,
                  role: "assistant",
                  content: data.message,
                });
                store.setStreaming(false);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      } catch {
        store.addMessage({
          id: assistantId,
          role: "assistant",
          content: "抱歉，网络似乎出了问题，请检查连接后重试。",
        });
        store.setStreaming(false);
      }
    },
    [store, loadConversations]
  );

  const loadHistory = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/history/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        store.setConversationId(conversationId);
        // 清空当前消息并加载历史，同时重置危机状态与行为信号
        useChatStore.setState({
          messages: data.messages.map(
            (m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            })
          ),
          crisisDetected: false,
          crisisKeywords: [],
          userBehavior: {
            lastMinimalResponse: null,
            messageTrend: "first_message",
            inputBehavior: {
              hesitating: false,
              hasRewritten: false,
              hasAbandoned: false,
            },
          },
        });
      }
    } catch {
      console.error("加载历史失败");
    }
  }, [store]);

  const newChat = useCallback(() => {
    store.resetChat();
  }, [store]);

  return {
    messages: store.messages,
    isStreaming: store.isStreaming,
    conversationId: store.conversationId,
    crisisDetected: store.crisisDetected,
    crisisKeywords: store.crisisKeywords,
    conversations: store.conversations,
    userBehavior: store.userBehavior,
    sendMessage,
    loadHistory,
    loadConversations,
    newChat,
    clearCrisis: store.clearCrisis,
  };
}

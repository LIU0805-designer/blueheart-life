/**
 * Zustand 聊天状态管理
 */
import { create } from "zustand";
import type { MinimalResponse, MessageTrend } from "@/lib/ai/behavior-signals";
import { detectMinimalResponse, analyzeMessageTrend } from "@/lib/ai/behavior-signals";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  /** 这条用户消息是否被检测为极简回复 */
  minimalResponse?: MinimalResponse | null;
}

interface ConversationInfo {
  id: string;
  title: string;
  updatedAt: string;
  crisisFlag: boolean;
}

export interface UserBehaviorState {
  /** 最新一条用户消息的极简回复检测结果 */
  lastMinimalResponse: MinimalResponse | null;
  /** 消息长度趋势 */
  messageTrend: MessageTrend;
  /** 用户输入行为信号（来自输入框监听，由 MessageInput 写入） */
  inputBehavior: {
    hesitating: boolean;
    hasRewritten: boolean;
    hasAbandoned: boolean;
  };
}

interface ChatState {
  // 当前对话
  conversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;

  // 对话列表
  conversations: ConversationInfo[];

  // 危机状态
  crisisDetected: boolean;
  crisisKeywords: string[];

  // 用户行为信号
  userBehavior: UserBehaviorState;

  // 操作
  setConversationId: (id: string | null) => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLastAssistant: (text: string) => void;
  setStreaming: (v: boolean) => void;
  setCrisis: (keywords: string[]) => void;
  clearCrisis: () => void;
  setConversations: (list: ConversationInfo[]) => void;
  setInputBehavior: (b: Partial<UserBehaviorState["inputBehavior"]>) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversationId: null,
  messages: [],
  isStreaming: false,
  conversations: [],
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

  setConversationId: (id) => set({ conversationId: id }),

  addMessage: (msg) =>
    set((s) => {
      const newMessages = [...s.messages, msg];

      // 如果是用户消息，检测极简回复 + 更新趋势
      let userBehavior = s.userBehavior;
      if (msg.role === "user") {
        const minimal = detectMinimalResponse(msg.content);
        msg.minimalResponse = minimal;
        userBehavior = {
          ...userBehavior,
          lastMinimalResponse: minimal,
          messageTrend: analyzeMessageTrend(newMessages),
        };
      }

      return { messages: newMessages, userBehavior };
    }),

  appendToLastAssistant: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      let last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = {
          ...last,
          content: last.content + text,
        };
      } else {
        msgs.push({
          id: "streaming-" + Date.now(),
          role: "assistant",
          content: text,
          isStreaming: true,
        });
      }
      return { messages: msgs };
    }),

  setStreaming: (v) =>
    set((s) => {
      if (!v) {
        // 流式结束时，清除最后一条 AI 消息的 isStreaming 标记
        const msgs = [...s.messages];
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant") {
          msgs[msgs.length - 1] = { ...last, isStreaming: false };
        }
        return { isStreaming: false, messages: msgs };
      }
      return { isStreaming: true };
    }),

  setCrisis: (keywords) =>
    set({ crisisDetected: true, crisisKeywords: keywords }),

  clearCrisis: () =>
    set({ crisisDetected: false, crisisKeywords: [] }),

  setConversations: (list) => set({ conversations: list }),

  setInputBehavior: (b) =>
    set((s) => ({
      userBehavior: {
        ...s.userBehavior,
        inputBehavior: { ...s.userBehavior.inputBehavior, ...b },
      },
    })),

  resetChat: () =>
    set({
      conversationId: null,
      messages: [],
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
    }),
}));

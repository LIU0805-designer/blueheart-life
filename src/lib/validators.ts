import { z } from "zod";

// 对话消息校验
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "消息不能为空")
    .max(2000, "消息过长，请控制在2000字以内"),
  conversationId: z.string().nullable().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// API 响应类型
export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "done"; conversationId: string; title: string }
  | { type: "error"; message: string };

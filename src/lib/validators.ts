import { z } from "zod";

// 对话消息校验
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "消息不能为空")
    .max(2000, "消息过长，请控制在2000字以内"),
  conversationId: z.string().nullable().optional(),
  // 前端采集的用户行为信号（可选，用于让 AI 读懂用户状态）
  behavior: z
    .object({
      lastMinimalResponse: z
        .object({
          type: z.enum(["dismissive", "speechless", "minimal"]),
          intensity: z.enum(["medium", "high"]),
        })
        .nullable()
        .optional(),
      messageTrend: z
        .enum(["stable", "shortening", "lengthening", "first_message"])
        .optional(),
      inputBehavior: z
        .object({
          hesitating: z.boolean().optional(),
          hasRewritten: z.boolean().optional(),
          hasAbandoned: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// API 响应类型
export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "done"; conversationId: string; title: string }
  | { type: "error"; message: string };

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
          type: z.enum(["dismissive", "speechless", "minimal", "agreement"]),
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

// 注册校验
export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "用户名至少 3 个字符")
    .max(20, "用户名最多 20 个字符")
    .refine(
      (v) => /^[一-龥A-Za-z0-9_]+$/.test(v),
      "用户名只能包含中英文、数字、下划线"
    ),
  password: z.string().min(6, "密码至少 6 位").max(72, "密码最长 72 位"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// 登录校验
export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

export type LoginInput = z.infer<typeof loginSchema>;

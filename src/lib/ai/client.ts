/**
 * DeepSeek API 客户端
 * 使用 OpenAI SDK（DeepSeek 兼容 OpenAI 接口格式）
 */
import OpenAI from "openai";

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

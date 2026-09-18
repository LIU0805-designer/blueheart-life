"use client";

import { ChatMessage } from "@/stores/chat-store";
import VoiceButton from "./VoiceButton";

interface Props {
  message: ChatMessage;
  /** 点击语音播放 */
  onPlayVoice?: (messageId: string) => void;
  /** 当前正在播放的消息 ID */
  playingVoiceId?: string | null;
}

export default function MessageBubble({
  message,
  onPlayVoice,
  playingVoiceId,
}: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`
          max-w-[75%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed
          ${
            isUser
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100"
          }
          ${message.isStreaming ? "animate-pulse" : ""}
        `}
      >
        {/* AI 消息标签 */}
        {!isUser && (
          <div className="text-xs font-medium text-blue-500 mb-1">
            蓝心
          </div>
        )}

        {/* 消息内容 */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 align-text-bottom animate-pulse rounded-sm" />
          )}
        </div>

        {/* AI 消息语音播放按钮（不在流式传输中） */}
        {!isUser && !message.isStreaming && onPlayVoice && (
          <VoiceButton
            onClick={() => onPlayVoice(message.id)}
            isPlaying={!!playingVoiceId && playingVoiceId === message.id}
          />
        )}
      </div>
    </div>
  );
}

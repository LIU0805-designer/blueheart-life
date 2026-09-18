/**
 * 语音设置状态管理
 */
import { create } from "zustand";

interface VoiceState {
  /** 新消息自动朗读 */
  autoPlay: boolean;
  toggleAutoPlay: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  autoPlay: false,
  toggleAutoPlay: () => set((s) => ({ autoPlay: !s.autoPlay })),
}));

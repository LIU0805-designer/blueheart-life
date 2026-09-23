/**
 * Zustand 登录状态管理
 */
import { create } from "zustand";

export interface AuthUser {
  id: string;
  username: string;
}

export type AuthStatus = "loading" | "authed" | "guest";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (u: AuthUser | null) => void;
  setStatus: (s: AuthStatus) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (u) => set({ user: u }),
  setStatus: (s) => set({ status: s }),
  reset: () => set({ user: null, status: "guest" }),
}));

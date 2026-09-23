/**
 * useAuth — 登录/注册/登出/会话查询
 * 全部通过 useAuthStore.setState 直写，保持回调稳定，避免依赖整体 store 造成循环
 */
"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      useAuthStore.setState({
        user: data.user ?? null,
        status: data.user ? "authed" : "guest",
      });
    } catch {
      useAuthStore.setState({ user: null, status: "guest" });
    }
  }, []);

  const register = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || "注册失败" };
        }
        useAuthStore.setState({ user: data.user, status: "authed" });
        return { ok: true };
      } catch {
        return { ok: false, error: "网络错误，请稍后重试" };
      }
    },
    []
  );

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || "登录失败" };
        }
        useAuthStore.setState({ user: data.user, status: "authed" });
        return { ok: true };
      } catch {
        return { ok: false, error: "网络错误，请稍后重试" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 忽略网络错误，前端照常清空登录态
    }
    useAuthStore.setState({ user: null, status: "guest" });
  }, []);

  return { user, status, fetchMe, register, login, logout };
}

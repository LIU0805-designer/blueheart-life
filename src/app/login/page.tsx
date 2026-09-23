"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (res.ok) {
      router.replace("/chat");
    } else {
      setError(res.error || "登录失败");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-b from-blue-50/60 to-white">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-6"
        >
          <Heart size={26} className="text-blue-500" fill="currentColor" />
          <span className="text-xl font-semibold text-slate-800">蓝心人生</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-blue-100/50 p-6">
          <h1 className="text-lg font-semibold text-slate-700 mb-1">登录</h1>
          <p className="text-sm text-slate-400 mb-6">回到你的蓝心身边</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="你的用户名"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "登录中…" : "登录"}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-5">
            还没有账号？{" "}
            <Link
              href="/register"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              注册一个
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

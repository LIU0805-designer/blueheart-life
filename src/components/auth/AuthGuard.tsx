"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * 路由守卫：未登录跳转 /login，加载中显示 spinner
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, fetchMe } = useAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "guest") {
    return (
      <div className="h-dvh flex items-center justify-center">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import ChatContainer from "@/components/chat/ChatContainer";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function ChatPage() {
  // 桌面端默认展开，移动端默认收起
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  return (
    <AuthGuard>
      <div className="h-dvh flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <div className="flex-1 flex min-h-0">
          <ConversationSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col min-h-0">
            <ChatContainer />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

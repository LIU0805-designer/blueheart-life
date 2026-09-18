"use client";

import Header from "@/components/layout/Header";
import ChatContainer from "@/components/chat/ChatContainer";

export default function ChatPage() {
  return (
    <div className="h-dvh flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col min-h-0">
        <ChatContainer />
      </div>
    </div>
  );
}

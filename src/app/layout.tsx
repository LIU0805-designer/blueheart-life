import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AmbientSoundProvider } from "@/components/shared/AmbientSoundContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "蓝心人生 — 你的 AI 心理陪伴者",
  description:
    "蓝心是一位基于心理学、哲学、教育学、社会学知识的 AI 心理陪伴者。随时倾听，温暖陪伴，引导你走向光明。",
  keywords: ["心理陪伴", "AI助手", "情绪支持", "心理咨询", "蓝心"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full antialiased">
        <AmbientSoundProvider>{children}</AmbientSoundProvider>
      </body>
    </html>
  );
}

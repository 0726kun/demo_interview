import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import { AgentProvider } from "@/contexts/AgentContext";
import { AgentPanel } from "@/components/AgentPanel";
import { AgentFab } from "@/components/AgentFab";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "渠道销售工作台",
  description: "资管公司内部 · 基金产品与客户关系管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}
      >
        <AgentProvider>
          <AppNav />
          <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          <AgentFab />
          <AgentPanel />
        </AgentProvider>
      </body>
    </html>
  );
}

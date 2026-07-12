import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "电商问数 Agent Demo",
  description: "TypeScript 精简版电商自然语言问数智能体",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
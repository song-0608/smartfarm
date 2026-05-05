import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "智农规划 - 农业种植规划助手",
  description: "拍照上传土地信息，结合实时天气，AI辅助种植规划，帮助农民实现收益最大化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-800">
        {children}
      </body>
    </html>
  );
}

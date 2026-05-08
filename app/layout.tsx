import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智农规划 - 农业种植规划助手",
  description: "拍照上传土地信息，结合实时天气，AI辅助种植规划",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-stone-50 text-stone-800">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

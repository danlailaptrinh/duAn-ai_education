// import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css"; // Global styles

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studydase - Trung tâm Kiểm soát Học tập Cá nhân hóa & Ôn thi THPT",
  description:
    "Trình quản lý tiến độ học tập thông minh tích hợp Bài giảng tương tác thích ứng và Gia sư trợ lý AI tối ưu cho học sinh THPT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body
        className="font-sans antialiased bg-[#0b0f19] text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

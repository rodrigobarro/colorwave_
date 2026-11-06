import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/logo";
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
  title: "Colorwave",
  description: "Crie e compartilhe paletas de cores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <div className="flex min-h-14 items-center justify-end px-6 pt-4">
          <AccountMenu />
        </div>
        <Logo />
        {children}
      </body>
    </html>
  );
}

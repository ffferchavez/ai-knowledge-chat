import type { Metadata } from "next";
import { Geist_Mono, Syne } from "next/font/google";

import { siteConfig } from "@/lib/config";

import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-[100dvh] min-h-screen flex-col bg-ui-bg font-sans text-ui-text"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

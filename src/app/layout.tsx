import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { TRPCProvider } from "@/trpc/client";

import { AppNavbar } from "./_components/app-navbar";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "DevRoast",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetBrainsMono.variable} bg-bg-page font-sans text-text-primary antialiased`}
      >
        <TRPCProvider>
          <div className="min-h-screen bg-bg-page">
            <AppNavbar />
            {children}
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}

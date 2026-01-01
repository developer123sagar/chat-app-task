import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./globals.css";
import "@/styles/auth.css";
import "@/styles/chat.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatSpace - Real-time Chat",
  description:
    "A modern real-time chat application with authentication, message persistence, and live presence tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>

          {/* <ReactQueryDevtools initialIsOpen={false} position="bottom" /> */}
        </QueryProvider>
      </body>
    </html>
  );
}

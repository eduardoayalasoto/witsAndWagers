import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ArenaBadge from "@/components/ArenaBadge";
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
  title: "Wits & Wagers",
  description:
    "Juego de trivia multijugador en tiempo real con estimaciones numéricas y apuestas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ArenaBadge />
      </body>
    </html>
  );
}

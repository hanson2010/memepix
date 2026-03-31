import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/SessionProvider";
import { getAuthSession } from "@/lib/session";
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
  title: "MemePix",
  description: "Share and discover meme pictures with humorous Chinese-to-English translations",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MemePix",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  openGraph: {
    title: "MemePix",
    description: "Share and discover meme pictures with humorous Chinese-to-English translations",
    type: "website",
    url: "https://memepix.pythoner.work",
    siteName: "MemePix",
  },
  twitter: {
    card: "summary_large_image",
    title: "MemePix",
    description: "Share and discover meme pictures with humorous Chinese-to-English translations",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

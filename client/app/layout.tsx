import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/NextAuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/providers/Posthog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatPulse",
  description: "A fast chat app",

  icons: {
    icon: {url: '/logo.svg', type: 'image/svg+xml'}
  },
  openGraph: {
    title: "ChatPulse",
    description: "A fast chat app",
    url: "https://chat-pulse-gilt.vercel.app/",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "ChatPulse - A fast chat app",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
          <link href="https://cdn.jsdelivr.net/npm/remixicon@3.6.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
          <AuthProvider>
            <QueryProvider>
              <PostHogProvider>
              {children}
              </PostHogProvider>
            </QueryProvider>
            <Toaster 
              position="top-right"
              closeButton
              theme="light"
              richColors
              toastOptions={{
                duration: 4000,
                style: {
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                },
                classNames: {
                  toast: "bg-white text-black border border-gray-200 shadow-lg",
                  description: "text-gray-700 opacity-100",
                  actionButton: "bg-blue-500 text-white",
                  cancelButton: "bg-gray-200 text-gray-800",
                }
              }}
            />
          </AuthProvider>
      </body>
    </html>
  );
}

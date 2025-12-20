import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ChatSF - Your AI Guide to San Francisco",
  description: "Ask anything about San Francisco neighborhoods, crime data, and city insights. Powered by AI with beautiful interactive maps.",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "ChatSF - Your AI Guide to San Francisco",
    description: "Ask anything about San Francisco neighborhoods, crime data, and city insights. Powered by AI with beautiful interactive maps.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <GoogleAnalytics />
        <ErrorBoundary>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ErrorBoundary>
      </body>
    </html>
  );
}

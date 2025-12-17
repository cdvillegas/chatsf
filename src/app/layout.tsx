import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import SessionProvider from "@/components/Auth/SessionProvider";
import Navbar from "@/components/Auth/Navbar";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rate My Neighborhood - SF",
  description: "Discover and rate San Francisco neighborhoods with our interactive map and community reviews",
  openGraph: {
    title: "Rate My Neighborhood - SF",
    description: "Discover and rate San Francisco neighborhoods with our interactive map and community reviews",
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
          <SessionProvider>
            <Navbar />
            {children}
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

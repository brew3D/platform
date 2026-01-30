import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppWrapper from "./components/AppWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Brew3D — Build 3D Worlds with AI",
  description: "Collaborate, render, and create 3D worlds together — right from your browser. AI-powered 3D creation platform for modern creators.",
  keywords: "3D modeling, AI, collaboration, cloud rendering, 3D creation, browser-based, real-time collaboration",
  authors: [{ name: "Brew3D Team" }],
  creator: "Brew3D",
  publisher: "Brew3D Studios",
  robots: "index, follow",
  icons: {
    icon: "/brew3d-logo.png",
    apple: "/brew3d-logo.png",
  },
  openGraph: {
    title: "Brew3D — Build 3D Worlds with AI",
    description: "Collaborate, render, and create 3D worlds together — right from your browser.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://brew3d.com",
    siteName: "Brew3D",
    images: [
      {
        url: "/meta/og-image.png",
        width: 1200,
        height: 630,
        alt: "Brew3D - AI-powered 3D creation platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brew3D — Build 3D Worlds with AI",
    description: "Collaborate, render, and create 3D worlds together — right from your browser.",
    images: ["/meta/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
              <AppWrapper>
                {children}
              </AppWrapper>
      </body>
    </html>
  );
}

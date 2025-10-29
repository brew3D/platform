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
  title: "PiWea — Build 3D Worlds with AI",
  description: "Collaborate, render, and create 3D worlds together — right from your browser. AI-powered 3D creation platform for modern creators.",
  keywords: "3D modeling, AI, collaboration, cloud rendering, 3D creation, browser-based, real-time collaboration",
  authors: [{ name: "PiWea Team" }],
  creator: "PiWea",
  publisher: "PiWea Studios",
  robots: "index, follow",
  openGraph: {
    title: "PiWea — Build 3D Worlds with AI",
    description: "Collaborate, render, and create 3D worlds together — right from your browser.",
    url: "https://nuvra.com",
    siteName: "PiWea",
    images: [
      {
        url: "/meta/og-image.png",
        width: 1200,
        height: 630,
        alt: "PiWea - AI-powered 3D creation platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PiWea — Build 3D Worlds with AI",
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

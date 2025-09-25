import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CollaborationProvider } from "./contexts/CollaborationContext";
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
  title: "Ruchi AI - Revolutionary 3D Creation Platform",
  description: "The future of 3D modeling - AI-powered, collaborative, and absolutely stunning",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AppWrapper>
          <AuthProvider>
            <CollaborationProvider>
              {children}
            </CollaborationProvider>
          </AuthProvider>
        </AppWrapper>
      </body>
    </html>
  );
}

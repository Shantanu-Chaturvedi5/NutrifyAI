import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "@fontsource/fraunces/300.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/400-italic.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/caveat/600.css";
import "./globals.css";
import { ThemeFlashGuard } from "@/components/ThemeFlashGuard";
import { ChatBubble } from "@/components/ChatBubble";

export const metadata: Metadata = {
  title: "Nouriq | Personal Nutrition Intelligence",
  description: "Understand your nutrition with health insights and guidance shaped around you.",
};

// The same variable names next/font used to define, now pointing at the
// bundled @fontsource families, so globals.css keeps working unchanged.
const fontVars = {
  "--font-fraunces": '"Fraunces"',
  "--font-work-sans": '"Work Sans"',
  "--font-jetbrains-mono": '"JetBrains Mono"',
} as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={fontVars} suppressHydrationWarning>
      <head>
        {/* Runs before paint so the stored theme choice applies
            immediately — without this, the page would flash light
            mode for a frame before switching to a saved dark
            preference. suppressHydrationWarning on <html> above is
            required because this script sets data-theme before React
            hydrates, which would otherwise be flagged as a mismatch. */}
        <ThemeFlashGuard />
      </head>
      <body>
        {children}
        <ChatBubble />
      </body>
    </html>
  );
}
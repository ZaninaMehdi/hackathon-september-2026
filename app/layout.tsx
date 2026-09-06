import type { Metadata } from "next";
import { Libre_Franklin, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Reserved for page titles and headline money figures only — body copy and UI
// chrome stay on Libre Franklin.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Amanah",
  description: "Every dollar, accounted for.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the script below sets data-theme and
    // colorScheme on <html> before React hydrates, so the server markup
    // intentionally differs from what the client finds.
    <html
      lang="en"
      className={`${libreFranklin.variable} ${ibmPlexMono.variable} ${sourceSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Must run synchronously before first paint, otherwise dark-mode
            users get a flash of the light palette. next/script's
            beforeInteractive strategy does not guarantee this. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        {children}
      </body>
    </html>
  );
}

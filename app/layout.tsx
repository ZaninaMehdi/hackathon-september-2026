import type { Metadata } from "next";
import { Libre_Franklin, IBM_Plex_Mono, Source_Serif_4, Amiri } from "next/font/google";
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

// The wordmark only, nothing else. Amiri is a revival of the Bulaq Press
// Naskh type and the house face of Arabic and Islamic publishing; its Latin
// companion lets the logotype carry that lineage without resorting to
// pseudo-Arabic lettering. Ships 400 and 700 only, hence font-bold in Logo.
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["latin"],
  weight: ["400", "700"],
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
      className={`${libreFranklin.variable} ${ibmPlexMono.variable} ${sourceSerif.variable} ${amiri.variable} h-full antialiased`}
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

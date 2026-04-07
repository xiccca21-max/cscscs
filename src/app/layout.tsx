import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SKINSELL - Sell Your Game Skins Instantly",
  description:
    "Sell your CS2, Dota 2, TF2 & Rust skins instantly. Get up to 95% of market value with fast payout.",
  icons: {
    icon: [{ url: "/favicon.jpeg", type: "image/jpeg" }],
    apple: "/favicon.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener('contextmenu',function(e){if(e.target.tagName==='IMG'){e.preventDefault()}});document.addEventListener('dragstart',function(e){if(e.target.tagName==='IMG'){e.preventDefault()}});`,
          }}
        />
      </body>
    </html>
  );
}

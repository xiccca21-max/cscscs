import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { MetaPixelClient } from "@/components/analytics/pixel-client";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

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
      <head>
        {META_PIXEL_ID && (
          <>
            <script
              id="meta-pixel"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`,
              }}
            />
            <noscript
              dangerouslySetInnerHTML={{
                __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${encodeURIComponent(META_PIXEL_ID)}&ev=PageView&noscript=1" />`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        {children}
        {META_PIXEL_ID && <MetaPixelClient />}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener('contextmenu',function(e){if(e.target.tagName==='IMG'){e.preventDefault()}});document.addEventListener('dragstart',function(e){if(e.target.tagName==='IMG'){e.preventDefault()}});`,
          }}
        />
      </body>
    </html>
  );
}

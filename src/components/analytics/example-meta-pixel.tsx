"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

/**
 * Пример встраивания Meta (Facebook) Pixel для обучения.
 * Задай в .env: NEXT_PUBLIC_META_PIXEL_ID=твой_id — иначе компонент ничего не рендерит.
 *
 * PageView: первый — из init-скрипта Meta; дальше при клиентской навигации Next — из эффекта ниже.
 */
function MetaPixelRoutePageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipNextPageView = useRef(true);

  useEffect(() => {
    if (!PIXEL_ID || typeof window.fbq !== "function") return;
    if (skipNextPageView.current) {
      skipNextPageView.current = false;
      return;
    }
    window.fbq("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}

export function ExampleMetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script
        id="example-meta-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');`,
        }}
      />
      <Script
        id="example-meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `fbq('init','${PIXEL_ID.replace(/'/g, "\\'")}');fbq('track','PageView');`,
        }}
      />
      <noscript>
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${encodeURIComponent(PIXEL_ID)}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <MetaPixelRoutePageViews />
      </Suspense>
    </>
  );
}

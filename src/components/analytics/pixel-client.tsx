"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get("auth") !== "1") return;

    trackMetaEvent("Lead");

    const next = new URLSearchParams(Array.from(searchParams.entries()));
    next.delete("auth");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    trackMetaEvent("PageView");
  }, [pathname]);

  return null;
}

export function MetaPixelClient() {
  return (
    <Suspense fallback={null}>
      <PixelTracker />
    </Suspense>
  );
}

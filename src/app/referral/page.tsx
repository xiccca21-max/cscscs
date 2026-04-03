"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReferralRedirect() {
  const router = useRouter();
  useEffect(() => {
    const q = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/en/referral${q}`);
  }, [router]);
  return null;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  try {
    if (params && Object.keys(params).length > 0) {
      fbq("track", event, params);
    } else {
      fbq("track", event);
    }
  } catch {
    /* noop */
  }
}

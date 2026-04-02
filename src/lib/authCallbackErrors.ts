/**
 * Maps infrastructure / DB errors from the Steam OAuth callback to stable URL-safe
 * codes. Never put raw provider messages (Neon quota, etc.) in ?error= — they leak
 * internals and look like "login is broken" when the real issue is billing/limits.
 */
export function mapAuthCallbackError(error: unknown): string {
  const msg =
    error instanceof Error ? error.message : String(error ?? "unknown");
  const lower = msg.toLowerCase();

  if (
    lower.includes("data transfer quota") ||
    lower.includes("compute time quota") ||
    (lower.includes("quota") && lower.includes("exceeded"))
  ) {
    return "db_quota";
  }

  if (
    lower.includes("p1017") ||
    lower.includes("server has closed the connection") ||
    lower.includes("connection") && lower.includes("refused")
  ) {
    return "db_unavailable";
  }

  console.error("[auth/callback] unmapped error:", error);
  return "server_error";
}

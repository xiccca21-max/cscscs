/**
 * Только для https — иначе на HTTP (IP:3000, localhost без TLS) браузер не сохранит cookie сессии.
 */
export function cookieSecure(): boolean {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https:");
}

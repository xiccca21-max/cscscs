/**
 * Канонический публичный origin без завершающего /.
 * Редиректы после OAuth не должны использовать request.url — там бывает host 0.0.0.0 или несовпадение с тем, что в .env.
 */
export function getAppOrigin(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (!u) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return u;
}

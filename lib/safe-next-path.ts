/** Restrict `?next=` to same-origin paths (open-redirect safe). */
export function safeNextPath(raw: string | string[] | undefined, fallback = "/account"): string {
  if (Array.isArray(raw)) return fallback;
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  return raw;
}

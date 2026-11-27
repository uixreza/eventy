/**
 * Shared validation for the two optional destinations on the landing ads.
 *
 * Browser-safe and server-safe: no I/O, so both the console form and the
 * Server Actions can use the same limits and normalization rules.
 */

/** Keeps the stored value small enough for both the input and the database. */
export const MAX_AD_LINK = 500;

/**
 * Accepts a full http(s) URL or a bare address such as `example.com/event`,
 * which is prefixed with `https://`. Empty means no link. Anything else is
 * rejected so it can never become an unsafe `href`.
 */
export function normalizeAdLink(raw: string): string | null {
  const clean = raw.trim();
  if (!clean) return "";
  if (clean.startsWith("//")) return null;

  const candidate = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

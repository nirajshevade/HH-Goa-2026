/**
 * Absolute-URL resolution for OG tags and share links.
 *
 * OG image URLs must be absolute, so this prefers an explicitly configured
 * origin and otherwise derives one from the request or the browser.
 */

function normalise(origin: string): string {
  return origin.replace(/\/+$/, "");
}

/** Server side: config first, then the forwarding proxy's headers. */
export function resolveOrigin(request?: {
  headers: { get(name: string): string | null };
  url?: string;
}): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return normalise(configured);

  const host = request?.headers.get("x-forwarded-host") ?? request?.headers.get("host");
  if (host) {
    const proto = request?.headers.get("x-forwarded-proto") ?? "https";
    return normalise(`${proto}://${host}`);
  }

  if (request?.url) {
    try {
      return normalise(new URL(request.url).origin);
    } catch {
      // Fall through.
    }
  }

  return "http://localhost:3000";
}

/** Client side: whatever origin the page is actually served from. */
export function browserOrigin(): string {
  if (typeof window !== "undefined") return normalise(window.location.origin);
  return normalise(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}

export function shareImagePath(id: string): string {
  return `/i/${id}.png`;
}

export function sharePagePath(id: string): string {
  return `/s/${id}`;
}

import "server-only";
import { SHARE_RATE_LIMIT_PER_HOUR } from "./config";

/**
 * Fixed-window per-IP limiter for the share upload endpoint — enough to stop a
 * script filling the store, without a Redis dependency.
 */

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 60 * 1000;

const windows = (() => {
  const globalRef = globalThis as typeof globalThis & {
    __hhRateLimit?: Map<string, Window>;
  };
  globalRef.__hhRateLimit ??= new Map<string, Window>();
  return globalRef.__hhRateLimit;
})();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound.
  if (windows.size > 5000) {
    for (const [k, window] of windows) {
      if (window.resetAt <= now) windows.delete(k);
    }
  }

  const existing = windows.get(key);
  const window =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + WINDOW_MS };

  window.count += 1;
  windows.set(key, window);

  const allowed = window.count <= SHARE_RATE_LIMIT_PER_HOUR;

  return {
    allowed,
    remaining: Math.max(0, SHARE_RATE_LIMIT_PER_HOUR - window.count),
    retryAfter: Math.max(1, Math.ceil((window.resetAt - now) / 1000)),
  };
}

/**
 * Best-effort client identity. `x-forwarded-for` is spoofable in general, but
 * behind the proxy this app is meant to run behind it is the left-most entry
 * that matters, and the limiter is a speed bump rather than an auth boundary.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

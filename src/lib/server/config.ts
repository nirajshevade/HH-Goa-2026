import "server-only";

function intFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const SHARE_TTL_MS = intFromEnv("SHARE_TTL_SECONDS", 86_400) * 1000;
export const SHARE_STORE_MAX_BYTES =
  intFromEnv("SHARE_STORE_MAX_MB", 128) * 1024 * 1024;
export const SHARE_RATE_LIMIT_PER_HOUR = intFromEnv(
  "SHARE_RATE_LIMIT_PER_HOUR",
  20,
);

/** Ceiling for a single shared graphic. 1080×1350 PNGs land well under this. */
export const MAX_SHARE_BYTES = 6 * 1024 * 1024;

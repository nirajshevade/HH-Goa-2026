import "server-only";
import { randomBytes } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import { OUTPUT } from "@/lib/brand";
import type { GraphicFormat } from "@/lib/graphics/types";
import { sanitizeText } from "@/lib/sanitize";
import { SHARE_TTL_MS } from "../config";
import {
  ID_PATTERN,
  type PutShareInput,
  type ShareBackend,
  type StoredShare,
} from "./types";

/**
 * Vercel Blob backend — the one that works on serverless, where the write and
 * the read run in different instances.
 *
 * There is no separate database. Everything `/s/<id>` needs is encoded in the
 * blob's own pathname:
 *
 *     shares/<id>/<format>/<base64url(name)>.png
 *
 * so a single prefixed `list()` recovers the whole record. The id is 128 bits
 * of randomness and `addRandomSuffix` is off, which keeps the URL stable for
 * the crawler while leaving it unguessable.
 *
 * Blob has no native TTL, so `expiresAt` is derived from `uploadedAt` and
 * enforced on read; `purgeExpired()` (wired to a daily Vercel cron) does the
 * actual deleting.
 */

const PREFIX = "shares/";
const TTL_SECONDS = Math.round(SHARE_TTL_MS / 1000);

function encodeName(name: string): string {
  // Empty segments are not valid in a pathname, so an absent name gets a stand-in.
  if (!name) return "_";
  return Buffer.from(name, "utf8").toString("base64url");
}

function decodeName(segment: string): string {
  if (!segment || segment === "_") return "";
  try {
    // Re-sanitised on the way out: the pathname is not a trusted channel just
    // because we wrote it.
    return sanitizeText(Buffer.from(segment, "base64url").toString("utf8"), {
      maxLength: 22,
    });
  } catch {
    return "";
  }
}

function isFormat(value: string): value is GraphicFormat {
  return Object.hasOwn(OUTPUT, value);
}

interface ParsedPath {
  id: string;
  format: GraphicFormat;
  name: string;
}

function parsePathname(pathname: string): ParsedPath | null {
  if (!pathname.startsWith(PREFIX)) return null;

  const [id, format, file] = pathname.slice(PREFIX.length).split("/");
  if (!id || !format || !file) return null;
  if (!ID_PATTERN.test(id) || !isFormat(format)) return null;

  return { id, format, name: decodeName(file.replace(/\.png$/i, "")) };
}

function toShare(
  parsed: ParsedPath,
  url: string,
  uploadedAt: Date,
): StoredShare {
  return {
    id: parsed.id,
    format: parsed.format,
    name: parsed.name,
    expiresAt: uploadedAt.getTime() + SHARE_TTL_MS,
    publicUrl: url,
  };
}

export const blobBackend: ShareBackend = {
  kind: "blob",

  async put({ bytes, format, name }: PutShareInput): Promise<StoredShare> {
    const id = randomBytes(16).toString("base64url");
    const pathname = `${PREFIX}${id}/${format}/${encodeName(name)}.png`;

    const result = await put(pathname, bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
      cacheControlMaxAge: TTL_SECONDS,
    });

    return {
      id,
      format,
      name,
      expiresAt: Date.now() + SHARE_TTL_MS,
      publicUrl: result.url,
    };
  },

  async get(id: string): Promise<StoredShare | null> {
    if (!ID_PATTERN.test(id)) return null;

    const { blobs } = await list({ prefix: `${PREFIX}${id}/`, limit: 1 });
    const found = blobs[0];
    if (!found) return null;

    const parsed = parsePathname(found.pathname);
    if (!parsed) return null;

    const share = toShare(parsed, found.url, found.uploadedAt);

    if (share.expiresAt <= Date.now()) {
      // Past its TTL but the purge cron has not reached it yet.
      void del(found.url).catch(() => undefined);
      return null;
    }

    return share;
  },

  async read(): Promise<Buffer | null> {
    // Blob serves the bytes from its own CDN; `/i/<id>.png` redirects there.
    return null;
  },

  async purgeExpired(): Promise<number> {
    const cutoff = Date.now() - SHARE_TTL_MS;
    const expired: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
      for (const blob of page.blobs) {
        if (blob.uploadedAt.getTime() <= cutoff) expired.push(blob.url);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    if (expired.length > 0) await del(expired);
    return expired.length;
  },
};

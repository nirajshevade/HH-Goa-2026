import "server-only";
import { randomBytes } from "node:crypto";
import { SHARE_STORE_MAX_BYTES, SHARE_TTL_MS } from "../config";
import {
  ID_PATTERN,
  type PutShareInput,
  type ShareBackend,
  type StoredShare,
} from "./types";

/**
 * In-process store. Used in development and anywhere the app runs as a single
 * long-lived instance. Bytes genuinely disappear when the TTL passes.
 *
 * Not suitable for serverless or multi-instance deployments — the write and the
 * read can land on different workers. `pickBackend()` selects the Blob backend
 * whenever a Blob token is configured, which is what Vercel deployments use.
 */

interface Entry extends StoredShare {
  bytes: Buffer;
  createdAt: number;
}

const entries = (() => {
  const globalRef = globalThis as typeof globalThis & {
    __hhShareStore?: Map<string, Entry>;
  };
  globalRef.__hhShareStore ??= new Map<string, Entry>();
  return globalRef.__hhShareStore;
})();

function totalBytes(): number {
  let total = 0;
  for (const entry of entries.values()) total += entry.bytes.byteLength;
  return total;
}

function sweep(now = Date.now()): number {
  let removed = 0;
  for (const [id, entry] of entries) {
    if (entry.expiresAt <= now) {
      entries.delete(id);
      removed += 1;
    }
  }
  return removed;
}

/** Drops the oldest entries until the store is back under its byte cap. */
function evictToFit(): void {
  if (totalBytes() <= SHARE_STORE_MAX_BYTES) return;

  const oldestFirst = [...entries.values()].sort(
    (a, b) => a.createdAt - b.createdAt,
  );

  for (const entry of oldestFirst) {
    if (totalBytes() <= SHARE_STORE_MAX_BYTES) break;
    entries.delete(entry.id);
  }
}

function toShare(entry: Entry): StoredShare {
  return {
    id: entry.id,
    format: entry.format,
    name: entry.name,
    expiresAt: entry.expiresAt,
    publicUrl: null,
  };
}

export const memoryBackend: ShareBackend = {
  kind: "memory",

  async put({ bytes, format, name }: PutShareInput): Promise<StoredShare> {
    sweep();

    const now = Date.now();
    const entry: Entry = {
      id: randomBytes(16).toString("base64url"),
      bytes,
      format,
      name,
      createdAt: now,
      expiresAt: now + SHARE_TTL_MS,
      publicUrl: null,
    };

    entries.set(entry.id, entry);
    evictToFit();

    return toShare(entry);
  },

  async get(id: string): Promise<StoredShare | null> {
    const entry = lookup(id);
    return entry ? toShare(entry) : null;
  },

  async read(id: string): Promise<Buffer | null> {
    return lookup(id)?.bytes ?? null;
  },

  async purgeExpired(): Promise<number> {
    return sweep();
  },
};

function lookup(id: string): Entry | null {
  // Anything that is not a well-formed id cannot be a real key; reject it
  // before it is used as a lookup or echoed back.
  if (!ID_PATTERN.test(id)) return null;

  const entry = entries.get(id);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    entries.delete(id);
    return null;
  }

  return entry;
}

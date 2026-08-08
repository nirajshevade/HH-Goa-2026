import "server-only";
import { OUTPUT } from "@/lib/brand";
import type { GraphicFormat } from "@/lib/graphics/types";
import { blobBackend } from "./stores/blob";
import { memoryBackend } from "./stores/memory";
import type { PutShareInput, ShareBackend, StoredShare } from "./stores/types";

export type { StoredShare } from "./stores/types";

/**
 * Short-lived storage for graphics the user chose to share.
 *
 * Only the finished, already-branded graphic is ever stored — the original
 * photo never leaves the device.
 *
 * The backend is chosen by configuration, not by code changes: set
 * `BLOB_READ_WRITE_TOKEN` (Vercel does this automatically once a Blob store is
 * connected) and shares go to Vercel Blob, which is what makes this work on
 * serverless. Without it, an in-process map is used — right for local dev and
 * for single-instance hosts.
 */
function pickBackend(): ShareBackend {
  return process.env.BLOB_READ_WRITE_TOKEN ? blobBackend : memoryBackend;
}

export function shareBackendKind(): ShareBackend["kind"] {
  return pickBackend().kind;
}

export function putShare(input: PutShareInput): Promise<StoredShare> {
  return pickBackend().put(input);
}

export function getShare(id: string): Promise<StoredShare | null> {
  return pickBackend().get(id);
}

export function readShareBytes(id: string): Promise<Buffer | null> {
  return pickBackend().read(id);
}

export function purgeExpiredShares(): Promise<number> {
  return pickBackend().purgeExpired();
}

export function shareDimensions(format: GraphicFormat): {
  width: number;
  height: number;
} {
  return OUTPUT[format];
}

/**
 * The absolute URL crawlers should fetch. Prefers the backend's own CDN URL and
 * falls back to this app serving the bytes from `/i/<id>.png`.
 */
export function shareImageUrl(share: StoredShare, origin: string): string {
  return share.publicUrl ?? `${origin}/i/${share.id}.png`;
}

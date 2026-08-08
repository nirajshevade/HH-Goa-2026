import "server-only";
import type { GraphicFormat } from "@/lib/graphics/types";

/** Ids are base64url of 16 random bytes — 128 bits, unguessable, fixed length. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export interface StoredShare {
  id: string;
  format: GraphicFormat;
  /** Display name, already sanitised. May be empty. */
  name: string;
  expiresAt: number;
  /**
   * A CDN URL the backend serves directly, when it has one. `null` means the
   * app must serve the bytes itself from `/i/<id>.png`.
   */
  publicUrl: string | null;
}

export interface PutShareInput {
  bytes: Buffer;
  format: GraphicFormat;
  name: string;
}

export interface ShareBackend {
  readonly kind: "memory" | "blob";
  put(input: PutShareInput): Promise<StoredShare>;
  get(id: string): Promise<StoredShare | null>;
  /** Raw bytes, for backends without their own CDN. `null` otherwise. */
  read(id: string): Promise<Buffer | null>;
  /** Removes everything past its TTL. Returns how many were deleted. */
  purgeExpired(): Promise<number>;
}

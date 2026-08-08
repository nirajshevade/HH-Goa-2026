import "server-only";
import { OUTPUT } from "@/lib/brand";
import type { GraphicFormat } from "@/lib/graphics/types";

/**
 * Validates an uploaded graphic from its bytes alone.
 *
 * The declared content type, the filename and any client-sent dimensions are
 * all ignored. A payload only gets stored if it really is a PNG whose IHDR
 * header matches one of the two sizes this app produces — which rules out
 * SVG, HTML, polyglots and anything else that could be served back to a
 * browser as something other than an image.
 */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface PngInfo {
  width: number;
  height: number;
}

export type ValidationResult =
  | { ok: true; info: PngInfo; format: GraphicFormat }
  | { ok: false; reason: string };

export function validateGraphicPng(bytes: Buffer): ValidationResult {
  // Signature + IHDR length + type + 13 data bytes + CRC.
  if (bytes.length < 33) {
    return { ok: false, reason: "That upload is too small to be a PNG." };
  }

  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { ok: false, reason: "Only PNG graphics are accepted." };
  }

  // The first chunk of a valid PNG must be IHDR.
  if (bytes.toString("ascii", 12, 16) !== "IHDR") {
    return { ok: false, reason: "That PNG is malformed." };
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);

  const format = matchFormat(width, height);
  if (!format) {
    return {
      ok: false,
      reason: "That image isn't one of the HH Goa 2026 graphic sizes.",
    };
  }

  return { ok: true, info: { width, height }, format };
}

function matchFormat(width: number, height: number): GraphicFormat | null {
  for (const [format, size] of Object.entries(OUTPUT)) {
    if (size.width === width && size.height === height) {
      return format as GraphicFormat;
    }
  }
  return null;
}

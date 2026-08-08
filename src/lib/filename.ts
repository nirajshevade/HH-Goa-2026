import type { GraphicFormat } from "@/lib/graphics/types";

/**
 * Builds the download filename, e.g. `hh-goa-2026-builder-priya-sharma.png`.
 *
 * The result is restricted to `[a-z0-9-]` so it can never contain a path
 * separator, a traversal segment, a leading dot, or a Windows-reserved character.
 */

const SEGMENT: Record<GraphicFormat, string> = {
  pfp: "pfp",
  id: "builder",
};

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // Drop combining marks left behind by the decomposition (é -> e).
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function buildFilename(format: GraphicFormat, name: string): string {
  const slug = slugify(name);
  const base = `hh-goa-2026-${SEGMENT[format]}`;
  return slug ? `${base}-${slug}.png` : `${base}.png`;
}

/**
 * HEIC/HEIF support.
 *
 * Safari decodes HEIC natively, so the decoder is only reached when the browser
 * genuinely cannot — and it is loaded with a dynamic `import()`, so the ~1MB of
 * WASM never touches the bundle for the majority of users who upload JPEGs.
 */

/** ISO-BMFF brands that identify a HEIF-family still image. */
const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

/**
 * Sniffs the container from the file's own bytes. `file.type` is empty for
 * HEIC on several Android browsers and is user-controllable in general, so the
 * bytes are what decide.
 */
export async function isHeicFile(file: File): Promise<boolean> {
  try {
    const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    if (header.length < 12) return false;

    // Bytes 4..8 must be the 'ftyp' box type.
    const boxType = String.fromCharCode(...header.slice(4, 8));
    if (boxType !== "ftyp") return false;

    const majorBrand = String.fromCharCode(...header.slice(8, 12)).toLowerCase();
    return HEIF_BRANDS.has(majorBrand);
  } catch {
    return false;
  }
}

/**
 * Converts to JPEG. Callers should only reach this after a native decode has
 * already failed.
 */
export async function convertHeicToJpeg(file: File): Promise<Blob> {
  const { heicTo } = await import("heic-to");

  const converted = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.92,
  });

  return converted;
}

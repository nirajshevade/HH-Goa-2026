import type { FocusPoint } from "./types";

/**
 * Works out where the subject of a photo sits, so the crop can keep them in
 * frame without the user touching a cropper.
 *
 * Two strategies, tried in order, neither of them a hard dependency:
 *
 *  1. The browser's `FaceDetector`, where it exists (some Chromium builds).
 *  2. A skin-tone + detail saliency pass over a downscaled copy — no
 *     dependency, no model download, works for group shots and off-centre
 *     subjects.
 *
 * If both come up empty the caller gets `DEFAULT_FOCUS`, which reproduces the
 * head-room bias of the approved design. Detection can never fail the render.
 */

/**
 * Slightly above centre — where a head sits in a typical portrait, and what the
 * approved design's fixed bias produced.
 */
export const DEFAULT_FOCUS: FocusPoint = {
  x: 0.5,
  y: 0.42,
  confidence: 0,
  source: "default",
};

/** Grid the saliency pass runs on. Small enough to be free, big enough to aim. */
const SAMPLE_EDGE = 64;

interface FaceDetectorLike {
  detect(source: CanvasImageSource): Promise<
    Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>
  >;
}

type FaceDetectorCtor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => FaceDetectorLike;

function getFaceDetector(): FaceDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { FaceDetector?: FaceDetectorCtor })
    .FaceDetector;
  return typeof ctor === "function" ? ctor : null;
}

async function detectViaFaceDetector(
  image: CanvasImageSource,
  width: number,
  height: number,
): Promise<FocusPoint | null> {
  const Detector = getFaceDetector();
  if (!Detector) return null;

  try {
    const faces = await new Detector({
      fastMode: true,
      maxDetectedFaces: 8,
    }).detect(image);

    if (!faces.length) return null;

    // Area-weighted centroid, so the nearest/largest face leads in a group shot.
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;

    for (const face of faces) {
      const { x, y, width: w, height: h } = face.boundingBox;
      const weight = Math.max(1, w * h);
      totalWeight += weight;
      sumX += (x + w / 2) * weight;
      sumY += (y + h / 2) * weight;
    }

    if (totalWeight <= 0) return null;

    return {
      x: clamp01(sumX / totalWeight / width),
      // Bias up a little so the crop keeps the chin and shoulders, not just eyes.
      y: clamp01(sumY / totalWeight / height + 0.04),
      confidence: 1,
      source: "face-detector",
    };
  } catch {
    return null;
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Rough skin-likeness in YCbCr — tolerant across skin tones, cheap to compute. */
function skinScore(r: number, g: number, b: number): number {
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const y = 0.299 * r + 0.587 * g + 0.114 * b;

  const inRange = cb >= 77 && cb <= 133 && cr >= 133 && cr <= 180 && y > 40;
  if (!inRange) return 0;

  // Peak in the middle of the range, taper at the edges.
  const cbFit = 1 - Math.abs(cb - 105) / 28;
  const crFit = 1 - Math.abs(cr - 156) / 23;
  return Math.max(0, Math.min(1, (cbFit + crFit) / 2));
}

function detectViaSaliency(
  image: CanvasImageSource,
  width: number,
  height: number,
): FocusPoint | null {
  if (typeof document === "undefined") return null;

  const scale = Math.min(SAMPLE_EDGE / width, SAMPLE_EDGE / height, 1);
  const w = Math.max(8, Math.round(width * scale));
  const h = Math.max(8, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  let pixels: Uint8ClampedArray;
  try {
    ctx.drawImage(image, 0, 0, w, h);
    pixels = ctx.getImageData(0, 0, w, h).data;
  } catch {
    // Tainted canvas or a source that failed to decode — fall back.
    return null;
  }

  const at = (x: number, y: number) => (y * w + x) * 4;
  const luma = new Float32Array(w * h);
  const skin = new Float32Array(w * h);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = at(x, y);
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      luma[y * w + x] = 0.299 * r + 0.587 * g + 0.114 * b;
      skin[y * w + x] = skinScore(r, g, b);
    }
  }

  let totalWeight = 0;
  let sumX = 0;
  let sumY = 0;
  let skinMass = 0;

  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const idx = y * w + x;

      // Sobel-lite gradient: detail attracts the eye, flat sky/wall does not.
      const gx = (luma[idx + 1] ?? 0) - (luma[idx - 1] ?? 0);
      const gy = (luma[idx + w] ?? 0) - (luma[idx - w] ?? 0);
      const detail = Math.min(1, Math.hypot(gx, gy) / 90);

      const s = skin[idx] ?? 0;
      skinMass += s;

      // Skin dominates; detail is the tiebreaker for non-portrait photos.
      const weight = s * 6 + detail;
      if (weight <= 0) continue;

      totalWeight += weight;
      sumX += (x + 0.5) * weight;
      sumY += (y + 0.5) * weight;
    }
  }

  if (totalWeight <= 0) return null;

  const cx = sumX / totalWeight / w;
  const cy = sumY / totalWeight / h;

  // Confidence rises with how much of the frame reads as skin, capped well
  // below 1 so the default bias always retains some pull.
  const skinRatio = skinMass / (w * h);
  const confidence = Math.min(0.85, skinRatio * 5);

  return {
    x: clamp01(cx),
    y: clamp01(cy),
    confidence,
    source: "saliency",
  };
}

/** Blends a low-confidence reading back toward the safe default. */
function stabilise(point: FocusPoint): FocusPoint {
  const t = point.confidence;
  return {
    x: DEFAULT_FOCUS.x + (point.x - DEFAULT_FOCUS.x) * t,
    y: DEFAULT_FOCUS.y + (point.y - DEFAULT_FOCUS.y) * t,
    confidence: point.confidence,
    source: point.source,
  };
}

export async function detectFocusPoint(
  image: CanvasImageSource,
  width: number,
  height: number,
): Promise<FocusPoint> {
  try {
    const face = await detectViaFaceDetector(image, width, height);
    if (face) return face;

    const salient = detectViaSaliency(image, width, height);
    if (salient) return stabilise(salient);
  } catch {
    // Detection is best-effort; never let it break generation.
  }

  return DEFAULT_FOCUS;
}

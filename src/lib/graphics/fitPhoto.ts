import type { CropRect, Ctx, FocusPoint, Orientation, PhotoSource, Rect } from "./types";

/**
 * Cover-fitting: the photo always fills its box at its true aspect ratio, with
 * the subject kept in frame. Nothing is ever stretched.
 */

export function detectOrientation(width: number, height: number): Orientation {
  if (height <= 0 || width <= 0) return "square";
  const ratio = width / height;
  if (ratio > 1.05) return "landscape";
  if (ratio < 0.95) return "portrait";
  return "square";
}

/**
 * Picks the source rectangle to sample so that `box` is filled edge to edge and
 * `focus` lands as close to the box centre as the source allows.
 *
 * The clamp is what makes off-centre subjects work: a face near the left edge
 * pulls the window left until the window hits the edge, then stops — so the
 * crop never samples outside the image and never leaves a gap.
 */
export function calculateCrop(
  source: { width: number; height: number },
  box: { width: number; height: number },
  focus: FocusPoint,
): CropRect {
  const { width: sw, height: sh } = source;

  if (sw <= 0 || sh <= 0 || box.width <= 0 || box.height <= 0) {
    return { sx: 0, sy: 0, sWidth: Math.max(1, sw), sHeight: Math.max(1, sh) };
  }

  const boxRatio = box.width / box.height;
  const sourceRatio = sw / sh;

  // Widest/tallest window of the box's aspect ratio that still fits the source.
  let windowWidth = sw;
  let windowHeight = sh;
  if (sourceRatio > boxRatio) {
    windowWidth = sh * boxRatio;
  } else {
    windowHeight = sw / boxRatio;
  }

  const desiredX = focus.x * sw - windowWidth / 2;
  const desiredY = focus.y * sh - windowHeight / 2;

  return {
    sx: clamp(desiredX, 0, sw - windowWidth),
    sy: clamp(desiredY, 0, sh - windowHeight),
    sWidth: windowWidth,
    sHeight: windowHeight,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Draws `photo` to fill `box`. Callers clip to the arch (or whatever shape)
 * before calling; this only handles the fit.
 */
export function fitPhoto(ctx: Ctx, photo: PhotoSource, box: Rect): void {
  const crop = calculateCrop(
    { width: photo.width, height: photo.height },
    { width: box.width, height: box.height },
    photo.focus,
  );

  ctx.drawImage(
    photo.image,
    crop.sx,
    crop.sy,
    crop.sWidth,
    crop.sHeight,
    box.x,
    box.y,
    box.width,
    box.height,
  );
}

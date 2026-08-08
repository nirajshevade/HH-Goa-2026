import type { Ctx } from "./types";

/**
 * Generic 2D drawing helpers. Nothing brand-specific lives here — see
 * `brandElements.ts` for the HH Goa marks built on top of these.
 */

export function roundRectPath(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * The arch silhouette that holds the photo: a semicircular top on straight
 * sides, with softly rounded bottom corners.
 */
export function archPath(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const bottomRadius = width * 0.05;
  const capRadius = width / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + height - bottomRadius);
  ctx.lineTo(x, y + capRadius);
  ctx.arc(x + capRadius, y + capRadius, capRadius, Math.PI, 0);
  ctx.lineTo(x + width, y + height - bottomRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRadius, y + height);
  ctx.lineTo(x + bottomRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bottomRadius);
  ctx.closePath();
}

/**
 * Deterministic print-style grain. A fixed seed keeps repeat renders of the
 * same input byte-identical.
 */
export function drawGrain(ctx: Ctx, width: number, height: number): void {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  ctx.save();
  for (let i = 0; i < 2400; i += 1) {
    ctx.fillStyle = random() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(random() * width, random() * height, 2, 2);
  }
  ctx.restore();
}

export interface RayOptions {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  count: number;
  fromAngle: number;
  toAngle: number;
  color: string;
}

/** Alternating long/short rays — the sunburst behind the arch. */
export function drawRays(ctx: Ctx, options: RayOptions): void {
  const { cx, cy, innerRadius, outerRadius, count, fromAngle, toAngle, color } =
    options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";

  for (let i = 0; i <= count; i += 1) {
    const angle = fromAngle + (toAngle - fromAngle) * (i / count);
    const isLong = i % 2 === 1;
    const length = isLong
      ? outerRadius
      : outerRadius - (outerRadius - innerRadius) * 0.42;

    ctx.lineWidth = isLong ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerRadius, cy + Math.sin(angle) * innerRadius);
    ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Shrinks `size` until `text` fits `maxWidth`, never going below `minSize`.
 * Returns the size that fits; the caller re-applies it via `ctx.font`.
 */
export function fitTextSize(
  ctx: Ctx,
  text: string,
  maxWidth: number,
  startSize: number,
  weight: string,
  family: string,
  minSize = 18,
): number {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;

  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }

  return size;
}

/** Hard-truncates with an ellipsis for text that still overflows at `minSize`. */
export function truncateToWidth(ctx: Ctx, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  const chars = Array.from(text);
  let end = chars.length;
  while (end > 1) {
    end -= 1;
    const candidate = `${chars.slice(0, end).join("").trimEnd()}…`;
    if (ctx.measureText(candidate).width <= maxWidth) return candidate;
  }
  return "…";
}

export interface TextOptions {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  weight: string;
  family: string;
  color: string;
  align?: CanvasTextAlign;
  /** Shrink-to-fit before truncating. Defaults to `size` (no shrinking). */
  minSize?: number;
}

/**
 * The single text entry point: shrink to fit, truncate if still too wide, draw.
 * Returns the size actually used so callers can lay out what follows.
 */
export function renderText(ctx: Ctx, options: TextOptions): number {
  const {
    text,
    x,
    y,
    maxWidth,
    size,
    weight,
    family,
    color,
    align = "left",
    minSize = size,
  } = options;

  if (!text) return size;

  ctx.save();
  const fitted = fitTextSize(ctx, text, maxWidth, size, weight, family, minSize);
  ctx.font = `${weight} ${fitted}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(truncateToWidth(ctx, text, maxWidth), x, y);
  ctx.restore();

  return fitted;
}

/** Measures text at a given font without disturbing the caller's state. */
export function measureAt(
  ctx: Ctx,
  text: string,
  weight: string,
  size: number,
  family: string,
): number {
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

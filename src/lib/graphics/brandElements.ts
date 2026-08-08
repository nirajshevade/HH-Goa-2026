import { COLORS, EVENT } from "@/lib/brand";
import { archPath, drawRays, roundRectPath } from "./primitives";
import { fitPhoto } from "./fitPhoto";
import type { Ctx, PhotoSource, Rect } from "./types";

/**
 * The HH Goa 2026 marks: the arch photo well with its sunburst, the गोवा
 * sticker, and the scrolling ticker band. Geometry follows the approved design.
 */

/** Fills the canvas with the Goa green ground. */
export function renderBackdrop(ctx: Ctx, width: number, height: number): void {
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(0, 0, width, height);
}

export interface ArchPhotoOptions {
  box: Rect;
  photo: PhotoSource;
  sunburst: boolean;
  /** Draws the deep-green offset plate behind the arch (Format A only). */
  plate?: boolean;
  rayCount?: number;
  rayInnerOffset?: number;
  rayOuterOffset?: number;
}

/**
 * The arch: sunburst rays, optional backing plate, the cover-fitted photo
 * clipped to the arch, and the yellow keyline.
 */
export function renderArchPhoto(ctx: Ctx, options: ArchPhotoOptions): void {
  const {
    box,
    photo,
    sunburst,
    plate = false,
    rayCount = 26,
    rayInnerOffset = 22,
    rayOuterOffset = 76,
  } = options;
  const { x, y, width, height } = box;

  if (sunburst) {
    drawRays(ctx, {
      cx: x + width / 2,
      // The rays radiate from the centre of the arch's semicircular cap.
      cy: y + width / 2,
      innerRadius: width / 2 + rayInnerOffset,
      outerRadius: width / 2 + rayOuterOffset,
      count: rayCount,
      fromAngle: Math.PI * 1.04,
      toAngle: Math.PI * 1.96,
      color: COLORS.yellow,
    });
  }

  ctx.save();

  if (plate) {
    ctx.fillStyle = COLORS.deep;
    archPath(ctx, x - 12, y - 12, width + 24, height + 24);
    ctx.fill();
  }

  ctx.save();
  archPath(ctx, x, y, width, height);
  ctx.clip();
  // Deep green under the photo so transparent PNGs never punch a hole.
  ctx.fillStyle = COLORS.deep;
  ctx.fillRect(x, y, width, height);
  fitPhoto(ctx, photo, box);
  ctx.restore();

  ctx.lineWidth = 6;
  ctx.strokeStyle = COLORS.yellow;
  archPath(ctx, x, y, width, height);
  ctx.stroke();

  ctx.restore();
}

/** The pink-on-yellow गोवा pill, rotated slightly like a stuck-on sticker. */
export function renderGoaSticker(
  ctx: Ctx,
  x: number,
  y: number,
  angle: number,
  size: number,
  stickerFamily: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.font = `800 ${size}px ${stickerFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const width = ctx.measureText(EVENT.sticker).width + size * 0.85;
  const height = size * 1.62;
  const border = 7;

  ctx.fillStyle = COLORS.yellow;
  roundRectPath(ctx, -width / 2, -height / 2, width, height, height / 2);
  ctx.fill();

  ctx.fillStyle = COLORS.pink;
  roundRectPath(
    ctx,
    -width / 2 + border,
    -height / 2 + border,
    width - border * 2,
    height - border * 2,
    (height - border * 2) / 2,
  );
  ctx.fill();

  ctx.fillStyle = COLORS.yellow;
  ctx.fillText(EVENT.sticker, 0, size * 0.06);

  ctx.restore();
}

/** The repeating yellow band along the foot of the Builder ID. */
export function renderTickerBand(
  ctx: Ctx,
  box: Rect,
  text: string,
  size: number,
  monoFamily: string,
): void {
  const { x, y, width, height } = box;

  ctx.save();
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(x, y, width, height);

  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  ctx.fillStyle = COLORS.green;
  ctx.font = `700 ${size}px ${monoFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const unit = ctx.measureText(text).width;
  if (unit > 0) {
    for (let px = x - 20; px < x + width; px += unit) {
      ctx.fillText(text, px, y + height / 2 + 2);
    }
  }

  ctx.restore();
}

/** The thin rounded keyline that frames the Builder ID card. */
export function renderCardFrame(ctx: Ctx, width: number, height: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,230,0,.55)";
  ctx.lineWidth = 3;
  roundRectPath(ctx, 34, 34, width - 68, height - 68, 46);
  ctx.stroke();
  ctx.restore();
}

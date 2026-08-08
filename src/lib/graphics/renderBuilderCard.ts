import { COLORS, EVENT, OUTPUT } from "@/lib/brand";
import {
  renderArchPhoto,
  renderBackdrop,
  renderCardFrame,
  renderGoaSticker,
  renderTickerBand,
} from "./brandElements";
import {
  drawGrain,
  fitTextSize,
  measureAt,
  renderText,
  roundRectPath,
  truncateToWidth,
} from "./primitives";
import type { BuilderCardOptions, Ctx } from "./types";

/**
 * Format B — the 1080 × 1350 Builder ID card.
 *
 * Layout constants are the approved design's, at its native 1080px scale.
 */

const ARCH = { x: 96, y: 206, width: 500, height: 584 };
/** Centre line of the right-hand brand column. */
const COLUMN_X = 838;
const COLUMN_MAX_WIDTH = 400;
const GUTTER = 78;

const TICKER_TEXT = `  HACKER HOUSE GOA ✳ ${EVENT.dates} ✳`;

export function renderBuilderCard(ctx: Ctx, options: BuilderCardOptions): void {
  const { width, height } = OUTPUT.id;
  const { photo, fonts, details, sunburst = true } = options;
  const contentWidth = width - GUTTER * 2;

  renderBackdrop(ctx, width, height);
  drawGrain(ctx, width, height);
  ctx.textBaseline = "alphabetic";
  renderCardFrame(ctx, width, height);

  /* ---------- header ---------- */

  renderText(ctx, {
    text: EVENT.studioShort,
    x: GUTTER,
    y: 112,
    maxWidth: 420,
    size: 26,
    weight: "700",
    family: fonts.mono,
    color: COLORS.yellow,
  });

  renderText(ctx, {
    text: `BUILDER ID · #${details.serial}`,
    x: width - GUTTER,
    y: 112,
    maxWidth: 420,
    size: 24,
    weight: "400",
    family: fonts.mono,
    color: COLORS.cream,
    align: "right",
  });

  /* ---------- photo ---------- */

  renderArchPhoto(ctx, {
    box: ARCH,
    photo,
    sunburst,
    rayCount: 20,
    rayInnerOffset: 18,
    rayOuterOffset: 52,
  });

  /* ---------- brand column ---------- */

  for (const [index, line] of ["HACKER", "HOUSE"].entries()) {
    renderText(ctx, {
      text: line,
      x: COLUMN_X,
      y: 330 + index * 62,
      maxWidth: COLUMN_MAX_WIDTH,
      size: 62,
      weight: "900",
      family: fonts.display,
      color: COLORS.yellow,
      align: "center",
    });
  }

  renderGoaSticker(ctx, COLUMN_X, 486, -0.07, 54, fonts.sticker);

  for (const [index, line] of [EVENT.place, "28–31 OCT", EVENT.year].entries()) {
    renderText(ctx, {
      text: line,
      x: COLUMN_X,
      y: 596 + index * 36,
      maxWidth: COLUMN_MAX_WIDTH,
      size: 22,
      weight: "400",
      family: fonts.mono,
      color: COLORS.cream,
      align: "center",
    });
  }

  /* ---------- identity ---------- */

  renderText(ctx, {
    text: (details.name || "Your Name").toUpperCase(),
    x: GUTTER,
    y: 880,
    maxWidth: contentWidth,
    size: 104,
    minSize: 44,
    weight: "900",
    family: fonts.display,
    color: COLORS.yellow,
  });

  if (details.stack) {
    renderText(ctx, {
      text: details.stack.toUpperCase(),
      x: GUTTER,
      y: 930,
      maxWidth: contentWidth,
      size: 28,
      minSize: 18,
      weight: "400",
      family: fonts.mono,
      color: COLORS.cream,
    });
  }

  renderTitlePill(ctx, details.title, fonts.display);

  if (details.building) {
    renderText(ctx, {
      text: `BUILDING → ${details.building.toUpperCase()}`,
      x: GUTTER,
      y: 1136,
      maxWidth: contentWidth,
      size: 26,
      minSize: 16,
      weight: "400",
      family: fonts.mono,
      color: "rgba(255,249,232,.8)",
    });
  }

  /* ---------- footer ---------- */

  renderTickerBand(
    ctx,
    { x: 34, y: height - 138, width: width - 68, height: 104 },
    TICKER_TEXT,
    30,
    fonts.mono,
  );
}

/**
 * The pink title pill. The pill is sized to the text rather than the reverse,
 * so a short title gets a tight badge and a long one shrinks to fit the card.
 */
function renderTitlePill(ctx: Ctx, rawTitle: string, displayFamily: string): void {
  const title = (rawTitle || "Beach Mode Builder").toUpperCase();
  const padding = 38;
  const maxTextWidth = OUTPUT.id.width - 200;

  const size = fitTextSize(
    ctx,
    title,
    maxTextWidth,
    62,
    "900",
    displayFamily,
    32,
  );

  ctx.save();
  ctx.font = `900 ${size}px ${displayFamily}`;
  const text = truncateToWidth(ctx, title, maxTextWidth);
  const textWidth = measureAt(ctx, text, "900", size, displayFamily);

  ctx.fillStyle = COLORS.pink;
  roundRectPath(ctx, GUTTER, 976, textWidth + padding * 2, 104, 52);
  ctx.fill();

  ctx.fillStyle = COLORS.yellow;
  ctx.textAlign = "left";
  ctx.fillText(text, GUTTER + padding, 976 + 70);
  ctx.restore();
}

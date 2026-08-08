import { COLORS, EVENT, OUTPUT } from "@/lib/brand";
import {
  renderArchPhoto,
  renderBackdrop,
  renderGoaSticker,
} from "./brandElements";
import { drawGrain, renderText } from "./primitives";
import type { Ctx, RenderOptions } from "./types";

/**
 * Format A — the 1080 × 1080 PFP frame.
 *
 * Layout constants are the approved design's, at its native 1080px scale.
 */

const ARCH = { x: 96, y: 122, width: 888, height: 748 };

export function renderPfpGraphic(ctx: Ctx, options: RenderOptions): void {
  const { width, height } = OUTPUT.pfp;
  const { photo, fonts, sunburst = true } = options;

  renderBackdrop(ctx, width, height);
  drawGrain(ctx, width, height);
  ctx.textBaseline = "alphabetic";

  renderArchPhoto(ctx, { box: ARCH, photo, sunburst, plate: true });

  // Sticker sits over the lower-left of the arch.
  renderGoaSticker(ctx, 236, ARCH.y + ARCH.height - 62, -0.09, 58, fonts.sticker);

  renderText(ctx, {
    text: "HACKER HOUSE",
    x: width / 2,
    y: 990,
    maxWidth: width - 150,
    size: 118,
    minSize: 60,
    weight: "900",
    family: fonts.display,
    color: COLORS.yellow,
    align: "center",
  });

  renderText(ctx, {
    text: `G O A   ${EVENT.year}   ·   2 8 – 3 1   O C T`,
    x: width / 2,
    y: 1032,
    maxWidth: width - 150,
    size: 27,
    minSize: 18,
    weight: "700",
    family: fonts.mono,
    color: COLORS.cream,
    align: "center",
  });

  renderText(ctx, {
    text: "2:47PM",
    x: 60,
    y: 74,
    maxWidth: 300,
    size: 22,
    weight: "700",
    family: fonts.mono,
    color: COLORS.yellow,
  });

  renderText(ctx, {
    text: EVENT.hashtagDisplay,
    x: width - 60,
    y: 74,
    maxWidth: 400,
    size: 22,
    weight: "400",
    family: fonts.mono,
    color: COLORS.cream,
    align: "right",
  });
}

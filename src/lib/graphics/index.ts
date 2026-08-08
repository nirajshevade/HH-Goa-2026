import { OUTPUT } from "@/lib/brand";
import { ensureCanvasFonts, FONT_FAMILIES } from "@/lib/fonts";
import { exportGraphic, type ExportedGraphic } from "./exportGraphic";
import { renderBuilderCard } from "./renderBuilderCard";
import { renderPfpGraphic } from "./renderPfp";
import type { BuilderDetails, GraphicFormat, PhotoSource } from "./types";

export * from "./types";
export { detectOrientation, calculateCrop, fitPhoto } from "./fitPhoto";
export { detectFocusPoint, DEFAULT_FOCUS } from "./subject";
export { renderPfpGraphic } from "./renderPfp";
export { renderBuilderCard } from "./renderBuilderCard";
export { renderText } from "./primitives";
export {
  exportGraphic,
  downloadGraphic,
  releaseGraphic,
  type ExportedGraphic,
} from "./exportGraphic";

export interface GenerateGraphicOptions {
  format: GraphicFormat;
  photo: PhotoSource;
  details: BuilderDetails;
  sunburst?: boolean;
}

/**
 * The one call the UI makes: compose off-screen at full resolution, then hand
 * back a PNG blob and a preview URL. No canvas element is shared with React.
 */
export async function generateGraphic(
  options: GenerateGraphicOptions,
): Promise<ExportedGraphic> {
  const { format, photo, details, sunburst = true } = options;
  const { width, height } = OUTPUT[format];

  await ensureCanvasFonts();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("This browser could not open a drawing canvas.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const shared = { photo, fonts: FONT_FAMILIES, sunburst };

  if (format === "pfp") {
    renderPfpGraphic(ctx, shared);
  } else {
    renderBuilderCard(ctx, { ...shared, details });
  }

  return exportGraphic(canvas, format, details.name);
}

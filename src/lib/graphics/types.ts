import type { FontFamilies } from "@/lib/fonts";

export type GraphicFormat = "pfp" | "id";

export type Orientation = "portrait" | "landscape" | "square";

/** Anything the 2D context can draw, paired with its intrinsic size. */
export interface PhotoSource {
  image: CanvasImageSource;
  width: number;
  height: number;
  /** Where the subject sits, normalised to 0–1 of the source. */
  focus: FocusPoint;
}

export interface FocusPoint {
  x: number;
  y: number;
  /** 0–1. Low confidence blends the point back toward the safe default. */
  confidence: number;
  source: "face-detector" | "saliency" | "default";
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Source-space rectangle to sample, plus the destination it fills. */
export interface CropRect {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

export interface BuilderDetails {
  name: string;
  stack: string;
  building: string;
  title: string;
  serial: string;
}

export interface RenderOptions {
  photo: PhotoSource;
  fonts: FontFamilies;
  /** The sunburst rays behind the arch. On in the approved design. */
  sunburst?: boolean;
}

export interface BuilderCardOptions extends RenderOptions {
  details: BuilderDetails;
}

export type Ctx = CanvasRenderingContext2D;

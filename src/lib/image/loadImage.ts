import { MAX_UPLOAD_BYTES, WORKING_RESOLUTION } from "@/lib/brand";
import { detectFocusPoint } from "@/lib/graphics/subject";
import type { Orientation, PhotoSource } from "@/lib/graphics/types";
import { detectOrientation } from "@/lib/graphics/fitPhoto";
import { convertHeicToJpeg, isHeicFile } from "./heic";

/**
 * Turns whatever the user picked into something the compositor can draw:
 * decoded, EXIF-rotated by the browser, downscaled to a working resolution,
 * and tagged with where the subject sits.
 *
 * Photos never leave the device — decoding and compositing are entirely local.
 */

export class PhotoError extends Error {}

export interface LoadedPhoto extends PhotoSource {
  fileName: string;
  orientation: Orientation;
  /** Small object URL for the confirmation thumbnail in the UI. */
  previewUrl: string;
}

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i;

export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  assertAcceptable(file);

  const decoded = await decode(file);
  const scaled = downscale(decoded, WORKING_RESOLUTION);

  // `downscale` passes the source straight through when it is already small
  // enough — closing the bitmap in that case would destroy the photo we are
  // about to draw.
  if (decoded instanceof ImageBitmap && scaled.image !== decoded) {
    decoded.close();
  }

  const focus = await detectFocusPoint(scaled.image, scaled.width, scaled.height);

  return {
    image: scaled.image,
    width: scaled.width,
    height: scaled.height,
    focus,
    fileName: file.name || "photo",
    orientation: detectOrientation(scaled.width, scaled.height),
    previewUrl: makeThumbnail(scaled.image, scaled.width, scaled.height),
  };
}

function assertAcceptable(file: File): void {
  if (!file) {
    throw new PhotoError("No file was selected.");
  }

  if (file.size === 0) {
    throw new PhotoError("That file is empty. Try picking the photo again.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new PhotoError(
      `That photo is over ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB. Pick a smaller one.`,
    );
  }

  // `type` is empty for HEIC on several Android browsers, so an unknown type is
  // allowed through to the decoder — which is the real gatekeeper.
  const typeLooksWrong = file.type !== "" && !file.type.startsWith("image/");
  const nameLooksWrong = !ACCEPTED_EXTENSIONS.test(file.name || "");

  if (typeLooksWrong && nameLooksWrong) {
    throw new PhotoError(
      "That file isn't an image. Try a JPG, PNG or HEIC photo.",
    );
  }
}

type Decoded = ImageBitmap | HTMLImageElement;

/**
 * Native decode first — Safari handles HEIC directly, and `createImageBitmap`
 * applies EXIF orientation. Only when that fails do we pay for the converter.
 */
async function decode(file: File): Promise<Decoded> {
  try {
    return await decodeBlob(file);
  } catch (nativeError) {
    if (!(await isHeicFile(file))) {
      throw new PhotoError(
        "We couldn't read that image. Try another one.",
        { cause: nativeError },
      );
    }
  }

  try {
    return await decodeBlob(await convertHeicToJpeg(file));
  } catch (conversionError) {
    throw new PhotoError(
      "We couldn't read that iPhone photo. Try saving it as JPEG and uploading again.",
      { cause: conversionError },
    );
  }
}

async function decodeBlob(blob: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Fall through to the <img> path (older Safari lacks the options bag).
    }
  }
  return decodeViaImageElement(blob);
}

function decodeViaImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        reject(new Error("Decoded image has no dimensions."));
        return;
      }
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The browser could not decode this image."));
    };

    image.decoding = "async";
    image.src = url;
  });
}

interface Scaled {
  image: CanvasImageSource;
  width: number;
  height: number;
}

function intrinsicSize(source: Decoded): { width: number; height: number } {
  return source instanceof ImageBitmap
    ? { width: source.width, height: source.height }
    : { width: source.naturalWidth, height: source.naturalHeight };
}

/**
 * Resizes to `maxEdge` so a 48MP phone photo doesn't cost a second of draw
 * time. Images already at or under the target are passed through untouched.
 */
function downscale(source: Decoded, maxEdge: number): Scaled {
  const { width, height } = intrinsicSize(source);

  if (width <= 0 || height <= 0) {
    throw new PhotoError("That image has no usable dimensions.");
  }

  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { image: source, width, height };
  }

  const ratio = maxEdge / longest;
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { image: source, width, height };

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  return { image: canvas, width: targetWidth, height: targetHeight };
}

/** A small data URL for the "photo ready" thumbnail — cheap and revoke-free. */
function makeThumbnail(
  image: CanvasImageSource,
  width: number,
  height: number,
): string {
  const edge = 160;
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const scale = Math.max(edge / width, edge / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;

  ctx.drawImage(
    image,
    (edge - drawWidth) / 2,
    (edge - drawHeight) * 0.35,
    drawWidth,
    drawHeight,
  );

  return canvas.toDataURL("image/jpeg", 0.7);
}

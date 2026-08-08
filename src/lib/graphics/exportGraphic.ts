import { buildFilename } from "@/lib/filename";
import type { GraphicFormat } from "./types";

export interface ExportedGraphic {
  blob: Blob;
  /** Object URL for the preview. Revoke with `releaseGraphic`. */
  objectUrl: string;
  filename: string;
  width: number;
  height: number;
}

/** Turns a rendered canvas into a real PNG file plus a preview URL. */
export async function exportGraphic(
  canvas: HTMLCanvasElement,
  format: GraphicFormat,
  name: string,
): Promise<ExportedGraphic> {
  const blob = await canvasToPngBlob(canvas);

  return {
    blob,
    objectUrl: URL.createObjectURL(blob),
    filename: buildFilename(format, name),
    width: canvas.width,
    height: canvas.height,
  };
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      // Very old WebKit paths return null; the data URL always works.
      try {
        resolve(dataUrlToBlob(canvas.toDataURL("image/png")));
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("The graphic could not be encoded."),
        );
      }
    }, "image/png");
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header = "", payload = ""] = dataUrl.split(",");
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const mime = /:(.*?);/.exec(header)?.[1] ?? "image/png";
  return new Blob([bytes], { type: mime });
}

export function releaseGraphic(graphic: ExportedGraphic | null): void {
  if (graphic) URL.revokeObjectURL(graphic.objectUrl);
}

/** Saves a blob to disk as a real file — never a new tab. */
export function downloadGraphic(graphic: ExportedGraphic): void {
  const link = document.createElement("a");
  link.href = graphic.objectUrl;
  link.download = graphic.filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

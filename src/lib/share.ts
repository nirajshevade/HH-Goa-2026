import { EVENT } from "./brand";
import { downloadGraphic, type ExportedGraphic } from "./graphics/exportGraphic";
import type { GraphicFormat } from "./graphics/types";

/**
 * Sharing to X.
 *
 * A web page cannot attach a local file to X's web composer — so the app never
 * claims it did. Two honest paths:
 *
 *  - `native`: the OS share sheet is available and takes the real PNG, so the
 *    X app receives the image as a genuine attachment.
 *  - `link`: the graphic is uploaded to a temporary URL and X's composer opens
 *    with the caption plus that link, which X unfurls into a large image card.
 *    The file is downloaded at the same time so it can be attached manually.
 *  - `text`: the upload failed; the composer still opens with the caption, and
 *    the UI says plainly that the image must be attached by hand.
 */

export type ShareOutcome =
  | { kind: "native" }
  | { kind: "link"; url: string; expiresAt: string }
  | { kind: "text" }
  | { kind: "blocked"; url: string }
  | { kind: "cancelled" };

const CAPTIONS: Record<GraphicFormat, string> = {
  pfp: `Just got my HH Goa 2026 frame. 🌴⚡\n\nSee you in Goa.\n\n${EVENT.hashtag}`,
  id: `Just got my HH Goa 2026 builder identity. 🌴⚡\n\nSee you in Goa.\n\n${EVENT.hashtag}`,
};

export function buildCaption(format: GraphicFormat): string {
  return CAPTIONS[format];
}

function intentUrl(caption: string, url?: string): string {
  const params = new URLSearchParams({ text: caption });
  if (url) params.set("url", url);
  return `https://x.com/intent/post?${params.toString()}`;
}

interface ShareUploadResponse {
  pageUrl: string;
  expiresAt: string;
}

async function uploadForShare(
  graphic: ExportedGraphic,
  name: string,
): Promise<ShareUploadResponse | null> {
  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        // Header value must be latin-1; the name is only used for the OG title.
        "x-hh-name": encodeURIComponent(name),
      },
      body: graphic.blob,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Partial<ShareUploadResponse>;
    if (!data.pageUrl || !data.expiresAt) return null;

    return { pageUrl: data.pageUrl, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}

function canShareFiles(files: File[]): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files })
  );
}

/**
 * Whether the OS share sheet is worth using.
 *
 * Desktop Chrome and Edge on Windows report `canShare({ files }) === true`, but
 * what they open is the *Windows* share dialog — which lists Mail and OneNote
 * and generally cannot reach X at all. A button labelled "Share on X" must open
 * X, so the native path is restricted to touch devices, where the sheet really
 * does hand the file to an installed X app.
 */
function shouldUseNativeShare(files: File[]): boolean {
  if (!canShareFiles(files)) return false;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

export interface ShareRequest {
  graphic: ExportedGraphic;
  format: GraphicFormat;
  name: string;
}

export async function shareToX({
  graphic,
  format,
  name,
}: ShareRequest): Promise<ShareOutcome> {
  const caption = buildCaption(format);
  const file = new File([graphic.blob], graphic.filename, { type: "image/png" });

  // Best path: the OS share sheet hands the actual file to the X app.
  if (shouldUseNativeShare([file])) {
    try {
      await navigator.share({ files: [file], text: caption });
      return { kind: "native" };
    } catch (error) {
      // The user dismissing the sheet is not a failure worth falling back from.
      if (error instanceof DOMException && error.name === "AbortError") {
        return { kind: "cancelled" };
      }
      // Anything else (e.g. share not permitted) falls through to the link path.
    }
  }

  // Opened up front, while the click gesture is still live, so the popup
  // blocker lets it through. It parks on about:blank until the upload resolves.
  //
  // The opener is deliberately *not* nulled here: about:blank inherits this
  // origin, and severing the relationship makes the later navigation fail in
  // some browsers. The tab is navigated to x.com and nowhere else.
  const composer = window.open("about:blank", "_blank");

  downloadGraphic(graphic);

  const uploaded = await uploadForShare(graphic, name);
  const target = intentUrl(caption, uploaded?.pageUrl);

  if (composer && !composer.closed) {
    composer.location.href = target;
  } else if (!window.open(target, "_blank", "noopener,noreferrer")) {
    // Both attempts blocked — hand the URL back so the UI can offer a link the
    // user can click themselves.
    return { kind: "blocked", url: target };
  }

  return uploaded
    ? { kind: "link", url: uploaded.pageUrl, expiresAt: uploaded.expiresAt }
    : { kind: "text" };
}

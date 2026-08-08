/**
 * HH Goa 2026 brand constants.
 *
 * Every value here is lifted from the approved design (`HH Goa Builder ID.dc.html`)
 * and is the single source of truth for both the DOM UI and the canvas renderer.
 */

export const COLORS = {
  green: "#0C5C31",
  deep: "#0A4E2A",
  yellow: "#FFE600",
  yellowShadow: "#C9B500",
  pink: "#FF1F7A",
  cream: "#FFF9E8",
} as const;

export const EVENT = {
  name: "Hacker House Goa",
  place: "GOA, INDIA",
  dates: "28–31 OCT 2026",
  year: "2026",
  studio: "2:47 PM STUDIO",
  studioShort: "2:47PM STUDIO",
  hashtag: "#FrameInGoa",
  hashtagDisplay: "#FRAMEINGOA",
  sticker: "गोवा",
} as const;

/** Output dimensions, taken from the approved design. */
export const OUTPUT = {
  pfp: { width: 1080, height: 1080 },
  id: { width: 1080, height: 1350 },
} as const;

/** Hard limit on accepted uploads, in bytes. Mirrored in the dropzone copy. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/**
 * Longest-edge resolution the source photo is downscaled to before compositing.
 * Both outputs are 1080px wide, so 2160 leaves ample headroom for the crop while
 * keeping decode + draw fast on phones.
 */
export const WORKING_RESOLUTION = 2160;

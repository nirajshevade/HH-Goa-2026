import { Bodoni_Moda, Space_Mono, Baloo_2 } from "next/font/google";

/**
 * Fonts are self-hosted by next/font so the canvas renderer never waits on a
 * third-party stylesheet. next/font mangles the family name, so the resolved
 * `style.fontFamily` strings are re-exported for `ctx.font`.
 */

// The variable names deliberately differ from Tailwind's `--font-display` /
// `--font-mono` / `--font-sticker` theme keys — those are defined *in terms of*
// these in globals.css, and reusing the names would make them self-referential.
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "900"],
  display: "swap",
  variable: "--font-bodoni",
});

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-space-mono",
});

export const baloo = Baloo_2({
  subsets: ["devanagari", "latin"],
  weight: ["800"],
  display: "swap",
  variable: "--font-baloo",
});

export const fontVariables = `${bodoni.variable} ${spaceMono.variable} ${baloo.variable}`;

/** Family strings in the form `ctx.font` expects. */
export const FONT_FAMILIES = {
  display: bodoni.style.fontFamily,
  mono: spaceMono.style.fontFamily,
  sticker: baloo.style.fontFamily,
} as const;

export type FontFamilies = typeof FONT_FAMILIES;

/**
 * Canvas text falls back to a system face unless the webfont is already in the
 * font set, so every weight/family the renderer uses is loaded up front.
 */
export async function ensureCanvasFonts(
  families: FontFamilies = FONT_FAMILIES,
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  const specs = [
    `900 40px ${families.display}`,
    `400 40px ${families.display}`,
    `700 20px ${families.mono}`,
    `400 20px ${families.mono}`,
    `800 40px ${families.sticker}`,
  ];

  await Promise.allSettled(specs.map((spec) => document.fonts.load(spec)));
  // `load()` resolves per-face; `ready` covers layout-triggered loads too.
  await document.fonts.ready.catch(() => undefined);
}

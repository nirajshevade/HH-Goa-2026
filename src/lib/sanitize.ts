/**
 * Text hygiene for anything a user typed.
 *
 * Everything the user provides is drawn onto a canvas (never injected as HTML),
 * so the risk here is not script execution but layout abuse: bidi overrides that
 * reverse the card, zero-width padding that defeats length limits, and combining
 * marks stacked into "Zalgo" that spills outside its box.
 */

// Control (Cc) and format (Cf) characters: C0/C1, zero-width space/joiners,
// bidi overrides and isolates, BOM. Plus line and paragraph separators.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

// Combining marks — capped rather than stripped, so Devanagari and accents survive.
const COMBINING = /\p{M}/u;

/** Collapses runs of more than two combining marks on a single base character. */
function limitCombiningMarks(input: string): string {
  let out = "";
  let run = 0;
  for (const char of input) {
    if (COMBINING.test(char)) {
      if (run >= 2) continue;
      run += 1;
    } else {
      run = 0;
    }
    out += char;
  }
  return out;
}

export interface SanitizeOptions {
  /** Truncated to this many characters after cleaning. */
  maxLength: number;
}

export function sanitizeText(
  value: unknown,
  { maxLength }: SanitizeOptions,
): string {
  if (typeof value !== "string") return "";

  const cleaned = limitCombiningMarks(
    value.normalize("NFC").replace(INVISIBLE, " "),
  )
    .replace(/\s+/gu, " ")
    .trim();

  const chars = Array.from(cleaned);
  if (chars.length <= maxLength) return cleaned;

  // Never cut mid-grapheme.
  return chars.slice(0, maxLength).join("").trim();
}

/** Field limits, matched to the `maxlength` attributes in the approved design. */
export const FIELD_LIMITS = {
  name: 22,
  stack: 46,
  building: 38,
} as const;

export interface BuilderInput {
  name: string;
  stack: string;
  building: string;
}

export function sanitizeBuilderInput(
  input: Partial<BuilderInput>,
): BuilderInput {
  return {
    name: sanitizeText(input.name, { maxLength: FIELD_LIMITS.name }),
    stack: sanitizeText(input.stack, { maxLength: FIELD_LIMITS.stack }),
    building: sanitizeText(input.building, { maxLength: FIELD_LIMITS.building }),
  };
}

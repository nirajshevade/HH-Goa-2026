import { NextResponse } from "next/server";
import { sanitizeText } from "@/lib/sanitize";
import { MAX_SHARE_BYTES, SHARE_TTL_MS } from "@/lib/server/config";
import { checkRateLimit, clientKey } from "@/lib/server/rateLimit";
import { putShare, shareImageUrl } from "@/lib/server/shareStore";
import { validateGraphicPng } from "@/lib/server/validatePng";
import { resolveOrigin, sharePagePath } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accepts a finished HH Goa graphic and returns a temporary public URL for it,
 * so X can render a large image card. Called only when the user taps "Share on
 * X" and the browser cannot attach the file directly.
 *
 * The request body is raw PNG bytes; the display name rides in a header so the
 * body stays a single validated blob.
 */
/** Headers are latin-1, so the display name arrives percent-encoded. */
function decodeHeader(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many shares from this network. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // Reject on the declared length before reading anything into memory.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_SHARE_BYTES) {
    return NextResponse.json({ error: "That graphic is too large." }, { status: 413 });
  }

  let bytes: Buffer;
  try {
    const buffer = await request.arrayBuffer();
    // The declared length is not trusted; the real size is checked here too.
    if (buffer.byteLength > MAX_SHARE_BYTES) {
      return NextResponse.json(
        { error: "That graphic is too large." },
        { status: 413 },
      );
    }
    bytes = Buffer.from(buffer);
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  const validation = validateGraphicPng(bytes);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 415 });
  }

  const name = sanitizeText(decodeHeader(request.headers.get("x-hh-name")), {
    maxLength: 22,
  });

  const origin = resolveOrigin(request);

  let entry;
  try {
    entry = await putShare({ bytes, format: validation.format, name });
  } catch {
    // Storage being unavailable must not break sharing — the client falls back
    // to opening X with the caption alone.
    return NextResponse.json(
      { error: "Could not create a share link right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      id: entry.id,
      pageUrl: `${origin}${sharePagePath(entry.id)}`,
      imageUrl: shareImageUrl(entry, origin),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      ttlSeconds: Math.round(SHARE_TTL_MS / 1000),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

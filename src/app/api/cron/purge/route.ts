import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { purgeExpiredShares, shareBackendKind } from "@/lib/server/shareStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deletes shared graphics past their TTL.
 *
 * Vercel Blob has no native expiry, so this is what actually removes the bytes.
 * Wired to a daily cron in `vercel.json`; Vercel sends `Authorization: Bearer
 * $CRON_SECRET` with each invocation.
 *
 * Expired shares are already unreachable before this runs — `getShare()`
 * enforces the TTL on read — so a missed run delays deletion but never exposes
 * anything.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const deleted = await purgeExpiredShares();
    return NextResponse.json(
      { ok: true, backend: shareBackendKind(), deleted },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Purge failed." }, { status: 500 });
  }
}

function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // Without a configured secret the endpoint stays shut rather than open.
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

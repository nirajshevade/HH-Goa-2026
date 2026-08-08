import { getShare, readShareBytes } from "@/lib/server/shareStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves a shared graphic. The route is `/i/<id>.png` so crawlers that sniff
 * extensions still see an image; the `.png` suffix is stripped before lookup.
 *
 * When the backend has its own CDN (Vercel Blob) this redirects there rather
 * than proxying the bytes. Crawlers follow the redirect, and the origin stops
 * paying egress twice.
 *
 * Unknown or expired ids return a plain 404 with no detail — there is nothing
 * here to distinguish "never existed" from "expired".
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: raw } = await context.params;
  const id = raw.replace(/\.png$/i, "");

  const share = await getShare(id);
  if (!share) return notFound();

  const maxAge = Math.max(0, Math.floor((share.expiresAt - Date.now()) / 1000));

  if (share.publicUrl) {
    return Response.redirect(share.publicUrl, 302);
  }

  const bytes = await readShareBytes(id);
  if (!bytes) return notFound();

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      // Immutable while it lives, gone the moment it expires.
      "Cache-Control": `public, max-age=${maxAge}, immutable`,
    },
  });
}

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BrandFooter, BrandHeader } from "@/components/Brand";
import {
  getShare,
  shareDimensions,
  shareImageUrl,
} from "@/lib/server/shareStore";
import { resolveOrigin, shareImagePath } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function origin(): Promise<string> {
  const headerList = await headers();
  return resolveOrigin({ headers: headerList });
}

/**
 * Per-graphic social metadata. The preview image is always the graphic the user
 * generated — never a generic site thumbnail.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getShare(id);

  if (!entry) {
    return {
      title: "This graphic has expired",
      robots: { index: false, follow: false },
    };
  }

  const title = "HH Goa 2026 Builder Identity";
  const description = entry.name
    ? `${entry.name}'s HH Goa 2026 builder identity`
    : "My HH Goa 2026 builder identity";

  const imageUrl = shareImageUrl(entry, await origin());
  const { width, height } = shareDimensions(entry.format);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: imageUrl, width, height, alt: description }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    // Shared graphics are unlisted; they should not accumulate in search.
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const entry = await getShare(id);

  if (!entry) notFound();

  const { width, height } = shareDimensions(entry.format);
  const description = entry.name
    ? `${entry.name}'s HH Goa 2026 builder identity`
    : "My HH Goa 2026 builder identity";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[470px] flex-col gap-[22px] px-[18px] pt-[18px] safe-bottom">
      <BrandHeader />

      <h1 className="font-display text-[clamp(34px,10vw,44px)] leading-[0.92] font-black uppercase text-goa-yellow">
        {description}
      </h1>

      {/* eslint-disable-next-line @next/next/no-img-element -- served from a short-lived in-memory route the optimizer must not cache */}
      <img
        src={shareImagePath(entry.id)}
        alt={description}
        width={width}
        height={height}
        className="block h-auto w-full rounded-[18px] shadow-[0_18px_44px_rgba(0,0,0,.4)]"
      />

      <Link
        href="/"
        className="btn-chunky flex min-h-[52px] w-full items-center justify-center rounded-full bg-goa-yellow px-6 py-[19px] text-[15px] leading-none font-bold tracking-[0.06em] text-goa-green transition-colors hover:bg-goa-yellow-hi"
      >
        Make your own
      </Link>

      <BrandFooter />
    </main>
  );
}

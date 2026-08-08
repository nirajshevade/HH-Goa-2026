"use client";

import { useState } from "react";
import { Button } from "./Button";
import { EVENT } from "@/lib/brand";
import { downloadGraphic, type ExportedGraphic } from "@/lib/graphics";
import type { GraphicFormat } from "@/lib/graphics/types";
import { buildCaption, shareToX, type ShareOutcome } from "@/lib/share";

interface ResultViewProps {
  graphic: ExportedGraphic;
  format: GraphicFormat;
  name: string;
  onReset: () => void;
}

export function ResultView({ graphic, format, name, onReset }: ResultViewProps) {
  const [sharing, setSharing] = useState(false);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await shareToX({ graphic, format, name });
      setOutcome(result);
      if (result.kind !== "native" && result.kind !== "cancelled") {
        setDownloaded(true);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="animate-hh-rise flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-2.5">
        <h1 className="font-display text-[34px] leading-none font-black uppercase text-goa-yellow">
          You&rsquo;re in.
        </h1>
        <p className="text-[10px] leading-none tracking-[0.14em] text-goa-cream/55">
          {graphic.width} × {graphic.height} PNG
        </p>
      </div>

      {/* A plain <img>, so long-press "Save image" works on mobile too. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- blob URL of a client-generated PNG; the Image optimizer cannot process it */}
      <img
        src={graphic.objectUrl}
        alt={
          format === "pfp"
            ? "Your HH Goa 2026 profile picture frame"
            : "Your HH Goa 2026 builder ID card"
        }
        width={graphic.width}
        height={graphic.height}
        className="block h-auto w-full rounded-[18px] shadow-[0_18px_44px_rgba(0,0,0,.4)]"
      />

      <div className="flex flex-col gap-2.5">
        <Button
          onClick={() => {
            downloadGraphic(graphic);
            setDownloaded(true);
          }}
        >
          Download image
        </Button>
        <Button variant="pink" onClick={handleShare} disabled={sharing}>
          {sharing ? "Opening X…" : "Share on X"}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Create another
        </Button>
      </div>

      <ShareNotice outcome={outcome} downloaded={downloaded} format={format} />
    </div>
  );
}

interface ShareNoticeProps {
  outcome: ShareOutcome | null;
  downloaded: boolean;
  format: GraphicFormat;
}

/**
 * Says exactly what happened. Nothing here ever implies the image was attached
 * to a tweet unless the OS share sheet genuinely did that.
 */
function ShareNotice({ outcome, downloaded, format }: ShareNoticeProps) {
  if (!outcome) {
    return (
      <p className="rounded-[18px] border-[1.5px] border-dashed border-goa-cream/25 px-4 py-3.5 text-[11px] leading-[1.6] text-goa-cream/60">
        {buildCaption(format).replace(/\n+/g, " ").replace(EVENT.hashtag, "")}
        <span className="text-goa-yellow">{EVENT.hashtag}</span>
      </p>
    );
  }

  const messages: Record<ShareOutcome["kind"], string> = {
    native:
      "Shared through your device's share sheet — the image goes across as a real attachment.",
    link: "X is open with your caption and a link to your graphic, which unfurls as the preview image. The PNG was downloaded too, if you'd rather attach it yourself.",
    text: "X is open with your caption. We couldn't create a preview link, so attach the downloaded PNG to your post before sending.",
    blocked:
      "Your browser blocked the pop-up, so X didn't open. Use the link below — your caption is already in it.",
    cancelled: "Share cancelled — nothing was posted.",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-2 rounded-[18px] border-[1.5px] border-dashed border-goa-yellow/45 bg-goa-deep px-4 py-3.5 text-[11px] leading-[1.6] text-goa-cream/75"
    >
      <p>{messages[outcome.kind]}</p>
      {outcome.kind === "blocked" && (
        <a
          href={outcome.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-goa-yellow underline underline-offset-2"
        >
          Open X compose →
        </a>
      )}
      {outcome.kind === "link" && (
        <p className="text-goa-cream/50">
          Preview link expires {new Date(outcome.expiresAt).toLocaleDateString()}.
        </p>
      )}
      {downloaded && outcome.kind !== "native" && (
        <p className="text-goa-cream/50">Saved to your downloads folder.</p>
      )}
    </div>
  );
}

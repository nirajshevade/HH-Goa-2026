"use client";

import { useId, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/brand";

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/*";
const MAX_MB = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);

interface PhotoDropzoneProps {
  onFile: (file: File) => void;
  busy: boolean;
}

/**
 * The empty state. A real `<input type="file">` inside a `<label>`, so it is
 * keyboard-reachable, announced correctly, and opens the camera roll on iOS
 * and Android without any JavaScript shim.
 *
 * On drag-over the dashed border transforms into a retro viewfinder with
 * corner brackets and a sweeping scanner line.
 */
export function PhotoDropzone({ onFile, busy }: PhotoDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const hintId = useId();

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-[28px] px-5 py-[34px] transition-all duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-goa-yellow ${
        dragging
          ? "border-2 border-transparent bg-goa-deep/80 scale-[1.02]"
          : "border-2 border-dashed border-goa-yellow/45 bg-goa-deep"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        id={inputId}
        type="file"
        accept={ACCEPT}
        disabled={busy}
        aria-describedby={hintId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          // Allow re-picking the same file after an error.
          event.target.value = "";
        }}
        className="sr-only"
      />

      {/* ── Viewfinder brackets and scanner (visible only when dragging) ── */}
      {dragging && (
        <>
          <div className="viewfinder-bracket viewfinder-bracket--tl" />
          <div className="viewfinder-bracket viewfinder-bracket--tr" />
          <div className="viewfinder-bracket viewfinder-bracket--bl" />
          <div className="viewfinder-bracket viewfinder-bracket--br" />
          <div className="viewfinder-scanner" />
        </>
      )}

      <span
        aria-hidden="true"
        className={`flex h-[46px] w-[46px] items-center justify-center rounded-full font-display text-[26px] leading-none font-black transition-transform duration-200 ${
          dragging
            ? "bg-goa-pink text-goa-cream scale-110"
            : "bg-goa-yellow text-goa-green"
        }`}
      >
        +
      </span>
      <span className="text-[14px] leading-[1.3] font-bold">
        {busy
          ? "Reading your photo…"
          : dragging
            ? "Drop it right here"
            : "Upload your photo"}
      </span>
      <span
        id={hintId}
        className="text-center text-[11px] leading-[1.5] text-goa-cream/55"
      >
        Tap to pick from your camera roll
        <br />
        or drag a file here · JPG/PNG/HEIC · {MAX_MB}MB max
      </span>
    </label>
  );
}

interface PhotoSummaryProps {
  fileName: string;
  previewUrl: string;
  onFile: (file: File) => void;
}

/** The "photo ready" row, with a Change control that reuses the same input. */
export function PhotoSummary({ fileName, previewUrl, onFile }: PhotoSummaryProps) {
  const inputId = useId();

  return (
    <div className="flex items-center gap-3.5 rounded-[22px] border-2 border-goa-yellow/35 bg-goa-deep p-3">
      <span
        role="img"
        aria-label="Your uploaded photo"
        style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
        className="h-16 w-16 flex-none rounded-t-full rounded-b-[12px] bg-goa-green bg-cover bg-[center_30%] shadow-[0_0_0_2px_var(--color-goa-yellow)]"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-[1.2] font-bold tracking-[0.08em] text-goa-yellow">
          PHOTO READY
        </p>
        <p className="mt-1 truncate text-[11px] leading-[1.4] text-goa-cream/60">
          {fileName}
        </p>
      </div>
      <label
        htmlFor={inputId}
        className="min-h-[44px] cursor-pointer rounded-full border-[1.5px] border-goa-cream/40 px-3.5 py-2.5 text-[11px] leading-[1.6] transition-colors hover:border-goa-yellow hover:text-goa-yellow has-[:focus-visible]:outline has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-goa-yellow"
      >
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
          className="sr-only"
        />
        Change
      </label>
    </div>
  );
}

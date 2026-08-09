"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandFooter, BrandHeader, GoaSticker } from "./Brand";
import { BuilderForm } from "./BuilderForm";
import { Button } from "./Button";
import { ErrorBanner } from "./ErrorBanner";
import { FormatPicker } from "./FormatPicker";
import { GeneratingState } from "./GeneratingState";
import { PhotoDropzone, PhotoSummary } from "./PhotoDropzone";
import { ResultView } from "./ResultView";
import {
  generateGraphic,
  releaseGraphic,
  type ExportedGraphic,
  type GraphicFormat,
} from "@/lib/graphics";
import { loadPhoto, PhotoError, type LoadedPhoto } from "@/lib/image/loadImage";
import { sanitizeBuilderInput, type BuilderInput } from "@/lib/sanitize";
import { generateBuilderTitle, generateSerial } from "@/lib/title";

type Screen = "landing" | "form" | "generating" | "result";

const EMPTY_INPUT: BuilderInput = { name: "", stack: "", building: "" };

/** Duration of the page-peel animation (ms). Must match CSS. */
const PEEL_DURATION = 600;

/**
 * The whole flow: pick a format, drop in a photo, (for Format B) add two
 * fields, generate, download, share. One page, no navigation, no account.
 */
export function IdentityStudio() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [format, setFormat] = useState<GraphicFormat>("pfp");
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const [input, setInput] = useState<BuilderInput>(EMPTY_INPUT);
  const [graphic, setGraphic] = useState<ExportedGraphic | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  /** When true the current screen plays the peel-away animation. */
  const [peeling, setPeeling] = useState(false);
  /** Stores what we should do once the peel finishes. */
  const pendingAction = useRef<(() => void) | null>(null);

  // Guards against a slow decode landing after the user has moved on.
  const loadToken = useRef(0);
  const graphicRef = useRef<ExportedGraphic | null>(null);

  useEffect(() => {
    graphicRef.current = graphic;
  }, [graphic]);

  useEffect(
    () => () => {
      releaseGraphic(graphicRef.current);
    },
    [],
  );

  /**
   * Kick off the peel animation, then run `action` once it completes.
   * If reduced-motion is active the action fires immediately.
   */
  const peelThen = useCallback((action: () => void) => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced) {
      action();
      return;
    }

    pendingAction.current = action;
    setPeeling(true);

    setTimeout(() => {
      setPeeling(false);
      pendingAction.current?.();
      pendingAction.current = null;
    }, PEEL_DURATION);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const token = ++loadToken.current;
    setUploading(true);
    setError("");

    try {
      const loaded = await loadPhoto(file);
      if (token !== loadToken.current) return;
      setPhoto(loaded);
    } catch (cause) {
      if (token !== loadToken.current) return;
      setError(
        cause instanceof PhotoError
          ? cause.message
          : "We couldn't read that image. Try another one.",
      );
    } finally {
      if (token === loadToken.current) setUploading(false);
    }
  }, []);

  const runGeneration = useCallback(
    async (currentPhoto: LoadedPhoto, currentFormat: GraphicFormat) => {
      const clean = sanitizeBuilderInput(input);
      setScreen("generating");
      setError("");

      try {
        const next = await generateGraphic({
          format: currentFormat,
          photo: currentPhoto,
          details: {
            ...clean,
            title: generateBuilderTitle(clean.name, clean.stack),
            serial: generateSerial(clean.name, clean.stack),
          },
        });

        releaseGraphic(graphicRef.current);
        setGraphic(next);
        setScreen("result");
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Something went wrong while generating. Try again.",
        );
        setScreen(currentFormat === "pfp" ? "landing" : "form");
      }
    },
    [input],
  );

  const handleNext = useCallback(() => {
    if (!photo) return;
    if (format === "pfp") {
      peelThen(() => void runGeneration(photo, "pfp"));
    } else {
      peelThen(() => setScreen("form"));
    }
  }, [format, photo, peelThen, runGeneration]);

  const handleFormSubmit = useCallback(() => {
    if (!photo) return;
    peelThen(() => void runGeneration(photo, "id"));
  }, [photo, peelThen, runGeneration]);

  const handleReset = useCallback(() => {
    loadToken.current += 1;
    releaseGraphic(graphicRef.current);
    setGraphic(null);
    setPhoto(null);
    setInput(EMPTY_INPUT);
    setError("");
    setUploading(false);
    setScreen("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[470px] flex-col gap-[22px] px-[18px] pt-[18px] safe-bottom">
      <BrandHeader />

      {screen === "landing" && (
        <div
          className={`flex flex-col gap-[22px] ${peeling ? "animate-page-peel" : ""}`}
        >
          <div>
            <h1 className="relative font-display text-[clamp(40px,12vw,54px)] leading-[0.9] font-black tracking-[-0.01em] uppercase text-goa-yellow">
              Your HH
              <br />
              Goa 2026
              <br />
              builder identity.
              <GoaSticker className="absolute -right-0.5 top-1.5 rotate-[-4deg]" />
            </h1>
            <p className="mt-3.5 text-[13px] leading-[1.6] text-goa-cream/70">
              Drop in your photo. Get a share-ready graphic in seconds. No signup,
              no crop, no fuss.
            </p>
          </div>

          <FormatPicker value={format} onChange={setFormat} />

          {photo ? (
            <div className="flex flex-col gap-3.5">
              <PhotoSummary
                fileName={photo.fileName}
                previewUrl={photo.previewUrl}
                onFile={handleFile}
              />
              <Button onClick={handleNext} disabled={uploading || peeling}>
                {format === "pfp" ? "Generate my frame" : "Add your details"}
              </Button>
            </div>
          ) : (
            <PhotoDropzone onFile={handleFile} busy={uploading} />
          )}

          {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
        </div>
      )}

      {screen === "form" && (
        <div className={peeling ? "animate-page-peel" : ""}>
          <BuilderForm
            value={input}
            onChange={(patch) => setInput((current) => ({ ...current, ...patch }))}
            onBack={() => setScreen("landing")}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}

      {screen === "generating" && <GeneratingState />}

      {screen === "result" && graphic && (
        <ResultView
          graphic={graphic}
          format={format}
          name={input.name}
          onReset={handleReset}
        />
      )}

      <BrandFooter />
    </main>
  );
}

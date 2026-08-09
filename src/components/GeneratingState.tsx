"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  "Reading your photo…",
  "Wrapping it in Goa green…",
  "Stamping the sticker…",
] as const;

/** Characters used for the scramble effect — hacker / leetspeak flavour. */
const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]=/\\|~^";

/** How long the scramble decoding animation takes per step (ms). */
const DECODE_DURATION = 380;
/** Interval between random character swaps during decoding (ms). */
const TICK_INTERVAL = 30;
/** How long to hold a fully decoded step before moving to the next (ms). */
const HOLD_DURATION = 900;

function randomChar(): string {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]!;
}

/**
 * Decodes `target` character-by-character over `DECODE_DURATION` ms.
 * Characters that haven't been "locked in" yet show as random glitch chars.
 */
function useScrambleText(target: string): string {
  const [display, setDisplay] = useState("");
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const len = target.length;
    const startTime = performance.now();

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / DECODE_DURATION, 1);
      const lockedCount = Math.floor(progress * len);

      let result = "";
      for (let i = 0; i < len; i++) {
        if (i < lockedCount) {
          result += target[i];
        } else if (target[i] === " " || target[i] === "…") {
          // Keep whitespace and ellipsis stable so it's readable
          result += target[i];
        } else {
          result += randomChar();
        }
      }
      setDisplay(result);

      if (progress < 1) {
        rafRef.current = window.setTimeout(tick, TICK_INTERVAL);
      }
    }

    tick();
    return () => clearTimeout(rafRef.current);
  }, [target]);

  return display;
}

/**
 * Shown only while generation is actually in flight — on most phones that is a
 * few hundred milliseconds and this barely appears.
 */
export function GeneratingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, DECODE_DURATION + HOLD_DURATION);
    return () => clearInterval(timer);
  }, []);

  const scrambled = useScrambleText(STEPS[step]!);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[58vh] flex-col items-center justify-center gap-6 text-center"
    >
      <div aria-hidden="true" className="relative h-[110px] w-[110px]">
        <div className="animate-hh-spin absolute inset-0 rounded-full border-[3px] border-dashed border-goa-yellow" />
        <div className="absolute inset-[22px] rounded-t-full rounded-b-[14px] bg-goa-pink" />
      </div>
      <div>
        <h1 className="font-display text-[30px] leading-[1.05] font-black uppercase text-goa-yellow">
          Building your
          <br />
          HH Goa identity
        </h1>
        {/* Screen reader gets the clean text; the visual scramble is aria-hidden */}
        <p className="sr-only">{STEPS[step]}</p>
        <p
          aria-hidden="true"
          className="mt-3 font-mono text-[12px] leading-[1.6] text-goa-cream/60"
          style={{ fontVariantLigatures: "none" }}
        >
          {scrambled}
        </p>
      </div>
    </div>
  );
}

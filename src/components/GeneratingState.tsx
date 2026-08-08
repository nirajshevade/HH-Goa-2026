"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading your photo…",
  "Wrapping it in Goa green…",
  "Stamping the sticker…",
] as const;

/**
 * Shown only while generation is actually in flight — on most phones that is a
 * few hundred milliseconds and this barely appears.
 */
export function GeneratingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, 420);
    return () => clearInterval(timer);
  }, []);

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
        <p className="animate-hh-blink mt-3 text-[12px] leading-[1.6] text-goa-cream/60">
          {STEPS[step]}
        </p>
      </div>
    </div>
  );
}

import { EVENT } from "@/lib/brand";

/** The `2:47PM / STUDIO` lockup and `#FRAMEINGOA` mark at the top of the page. */
export function BrandHeader() {
  return (
    <header className="flex items-center justify-between gap-3">
      <p className="text-[13px] leading-[1.05] font-bold tracking-[0.06em] text-goa-yellow">
        2:47<span className="text-[9px]">PM</span>
        <br />
        STUDIO
      </p>
      <p className="text-[11px] tracking-[0.18em] text-goa-cream/60">
        {EVENT.hashtagDisplay}
      </p>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="mt-auto flex justify-between gap-3 pt-4 text-[10px] tracking-[0.1em] text-goa-cream/45">
      <span>
        {EVENT.place} · {EVENT.dates}
      </span>
      <span>{EVENT.studio}</span>
    </footer>
  );
}

/** The rotated गोवा sticker used in the hero. */
export function GoaSticker({ className = "" }: { className?: string }) {
  return (
    <span
      lang="mr"
      className={`animate-hh-pop inline-block rounded-full bg-goa-pink px-[15px] pt-[7px] pb-[10px] font-sticker text-[26px] leading-none font-extrabold text-goa-yellow shadow-[0_0_0_4px_var(--color-goa-yellow)] ${className}`}
    >
      {EVENT.sticker}
    </span>
  );
}

import Link from "next/link";
import { BrandFooter, BrandHeader } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[470px] flex-col gap-[22px] px-[18px] pt-[18px] safe-bottom">
      <BrandHeader />

      <div>
        <h1 className="font-display text-[clamp(38px,11vw,50px)] leading-[0.92] font-black uppercase text-goa-yellow">
          Nothing here.
        </h1>
        <p className="mt-3.5 text-[13px] leading-[1.6] text-goa-cream/70">
          Shared graphics are temporary — this one has expired or never existed.
          Make a fresh one, it takes a few seconds.
        </p>
      </div>

      <Link
        href="/"
        className="btn-chunky flex min-h-[52px] w-full items-center justify-center rounded-full bg-goa-yellow px-6 py-[19px] text-[15px] leading-none font-bold tracking-[0.06em] text-goa-green transition-colors hover:bg-goa-yellow-hi"
      >
        Start over
      </Link>

      <BrandFooter />
    </main>
  );
}

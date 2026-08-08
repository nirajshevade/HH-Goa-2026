import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "pink" | "outline" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "btn-chunky bg-goa-yellow text-goa-green font-bold tracking-[0.06em] hover:bg-goa-yellow-hi",
  pink: "border-2 border-goa-pink bg-goa-pink text-goa-cream font-bold tracking-[0.06em] hover:bg-goa-green hover:text-goa-pink",
  outline:
    "border-[1.5px] border-goa-cream/35 text-goa-cream hover:border-goa-yellow hover:text-goa-yellow",
  ghost: "text-goa-cream/60 underline hover:text-goa-yellow hover:opacity-100",
};

const SIZES: Record<Variant, string> = {
  primary: "w-full rounded-full px-6 py-[19px] text-[15px]",
  pink: "w-full rounded-full px-6 py-[18px] text-[14px]",
  outline: "rounded-full px-[22px] py-[18px] text-[13px]",
  ghost: "w-full rounded-full px-4 py-4 text-[12px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Every tap target here clears 44px, which is what makes the flow usable
 * one-handed on a phone.
 */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-[52px] cursor-pointer leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${SIZES[variant]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

"use client";

import type { GraphicFormat } from "@/lib/graphics/types";

interface FormatPickerProps {
  value: GraphicFormat;
  onChange: (format: GraphicFormat) => void;
}

/**
 * Format A / Format B chooser. Built on real radio inputs so arrow keys work
 * and screen readers announce it as a single grouped choice.
 */
export function FormatPicker({ value, onChange }: FormatPickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Choose a graphic format</legend>
      <div className="grid grid-cols-2 gap-3">
        <FormatTile
          format="pfp"
          checked={value === "pfp"}
          onChange={onChange}
          label="PFP FRAME"
          hint="Square · profile picture"
          preview={<PfpPreview />}
        />
        <FormatTile
          format="id"
          checked={value === "id"}
          onChange={onChange}
          label="BUILDER ID"
          hint="Card · name + title"
          preview={<IdPreview />}
        />
      </div>
    </fieldset>
  );
}

interface FormatTileProps {
  format: GraphicFormat;
  checked: boolean;
  onChange: (format: GraphicFormat) => void;
  label: string;
  hint: string;
  preview: React.ReactNode;
}

function FormatTile({
  format,
  checked,
  onChange,
  label,
  hint,
  preview,
}: FormatTileProps) {
  return (
    <label
      className={`block cursor-pointer rounded-[22px] border-2 p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-goa-yellow ${
        checked
          ? "border-goa-yellow bg-goa-yellow/12"
          : "border-goa-cream/20 bg-goa-deep hover:border-goa-cream/40"
      }`}
    >
      <input
        type="radio"
        name="format"
        value={format}
        checked={checked}
        onChange={() => onChange(format)}
        className="sr-only"
      />
      <div aria-hidden="true">{preview}</div>
      <p className="mt-2.5 text-[12px] leading-none font-bold tracking-[0.1em]">
        {label}
      </p>
      <p className="mt-1.5 text-[10px] leading-[1.4] text-goa-cream/60">{hint}</p>
    </label>
  );
}

/** Miniature of the square PFP frame. */
function PfpPreview() {
  return (
    <div className="relative flex aspect-square items-end justify-center overflow-hidden rounded-[14px] bg-goa-deep">
      <div className="absolute top-[16%] right-[18%] bottom-[30%] left-[18%] rounded-t-full rounded-b-[8px] bg-[#2E7D4F] shadow-[0_0_0_2px_var(--color-goa-yellow)]" />
      <div className="absolute bottom-[9%] left-[12%] h-3 w-[22px] rounded-full bg-goa-pink" />
      <div className="h-[22%] w-full border-t-2 border-goa-yellow bg-goa-green" />
    </div>
  );
}

/** Miniature of the Builder ID card. */
function IdPreview() {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[14px] bg-goa-deep p-[9px]">
      <div className="h-[52%] w-[46%] rounded-t-full rounded-b-[8px] bg-[#2E7D4F] shadow-[0_0_0_2px_var(--color-goa-yellow)]" />
      <div className="absolute top-[11px] right-[9px] h-2.5 w-[26px] rounded-full bg-goa-pink" />
      <div className="mt-[9px] h-[9px] w-[78%] rounded-[3px] bg-goa-yellow" />
      <div className="mt-1.5 h-[5px] w-[56%] rounded-[3px] bg-goa-cream/55" />
      <div className="absolute right-[9px] bottom-[9px] left-[9px] h-3.5 rounded-[4px] bg-goa-yellow" />
    </div>
  );
}

"use client";

import { useId } from "react";
import { Button } from "./Button";
import { FIELD_LIMITS, type BuilderInput } from "@/lib/sanitize";

interface BuilderFormProps {
  value: BuilderInput;
  onChange: (patch: Partial<BuilderInput>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

/**
 * The two-and-a-bit fields behind Format B. A real `<form>`, so Enter submits
 * and mobile keyboards show a "Go" key.
 */
export function BuilderForm({
  value,
  onChange,
  onBack,
  onSubmit,
}: BuilderFormProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="animate-hh-rise flex flex-col gap-5"
    >
      <div>
        {/* One screen renders at a time, so each owns the page's h1. */}
        <h1 className="font-display text-[42px] leading-[0.92] font-black uppercase text-goa-yellow">
          Who&rsquo;s
          <br />
          building?
        </h1>
        <p className="mt-2.5 text-[12px] leading-[1.6] text-goa-cream/65">
          Two fields. Your builder title gets generated from your stack.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <Field
          label="Name"
          placeholder="Priya Sharma"
          maxLength={FIELD_LIMITS.name}
          value={value.name}
          autoComplete="name"
          autoFocus
          onChange={(name) => onChange({ name })}
        />
        <Field
          label="Stack / Role"
          placeholder="AI Engineer · React · Python"
          maxLength={FIELD_LIMITS.stack}
          value={value.stack}
          onChange={(stack) => onChange({ stack })}
        />
        <Field
          label="Currently building"
          optional
          placeholder="an agent that books my chai"
          maxLength={FIELD_LIMITS.building}
          value={value.building}
          onChange={(building) => onChange({ building })}
        />
      </div>

      <div className="flex gap-2.5">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Generate my ID
        </Button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  maxLength: number;
  value: string;
  optional?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

function Field({
  label,
  placeholder,
  maxLength,
  value,
  optional = false,
  autoComplete,
  autoFocus,
  onChange,
}: FieldProps) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[11px] leading-none font-bold tracking-[0.16em] text-goa-yellow uppercase"
      >
        {label}
        {optional && (
          <span className="tracking-[0.06em] text-goa-cream/45"> — optional</span>
        )}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-h-[54px] rounded-full border-2 border-goa-cream/30 bg-goa-deep px-5 py-4 text-[14px] leading-none text-goa-cream transition-colors placeholder:text-goa-cream/35 hover:border-goa-cream/50 focus:border-goa-yellow focus:outline-none"
      />
    </div>
  );
}

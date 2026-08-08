interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Recoverable failures. Announced politely so it doesn't interrupt typing. */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-[18px] bg-goa-pink px-4 py-3.5 text-goa-cream"
    >
      <span aria-hidden="true" className="text-[13px] leading-[1.4] font-bold">
        !
      </span>
      <p className="flex-1 text-[12px] leading-[1.5]">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="-m-2 cursor-pointer p-2 text-[12px] leading-none font-bold opacity-80 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

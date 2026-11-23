export function OrnamentalDivider({ label }: { label?: string }) {
  return (
    <div className="my-10 flex items-center gap-4" aria-hidden={!label}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/70 to-blue-800/40" />
      <div className="flex items-center gap-2.5">
        <svg
          width="28"
          height="16"
          viewBox="0 0 28 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden="true"
        >
          <path
            d="M14 1L17.5 8L14 15L10.5 8L14 1Z"
            fill="url(#ornament-gold)"
          />
          <path
            d="M4 8L9 4.5L7.5 8L9 11.5L4 8Z"
            fill="#1e40af"
            fillOpacity="0.8"
          />
          <path
            d="M24 8L19 4.5L20.5 8L19 11.5L24 8Z"
            fill="#0d9488"
            fillOpacity="0.85"
          />
          <defs>
            <linearGradient id="ornament-gold" x1="10.5" y1="1" x2="17.5" y2="15" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#b45309" />
            </linearGradient>
          </defs>
        </svg>
        {label && (
          <span className="font-serif text-xs font-semibold tracking-wide text-slate-600">
            {label}
          </span>
        )}
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-400/70 to-teal-700/40" />
    </div>
  );
}

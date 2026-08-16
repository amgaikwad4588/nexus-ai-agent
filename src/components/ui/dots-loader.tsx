/**
 * Pulsing-dots loader for page-level loading states. Styled via `.dots-loader`
 * in globals.css and themed to the brand accent. Optional `label` renders muted
 * text beneath the dots.
 */
export function DotsLoader({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="dots-loader" role="status" aria-label={label || "Loading"}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="circle" key={i}>
            <div className="dot" />
            <div className="outline" />
          </div>
        ))}
      </div>
      {label && <span className="text-sm text-[#737373]">{label}</span>}
    </div>
  );
}

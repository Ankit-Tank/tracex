import React from "react";

export default function Logo({ size = "md", showSubtitle = true, className = "" }) {
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  const iconDim = isSmall ? "w-7 h-7" : isLarge ? "w-11 h-11" : "w-8 h-8";
  const titleSize = isSmall ? "text-[14px]" : isLarge ? "text-[20px]" : "text-[16px]";
  const subSize = isSmall ? "text-[9.5px]" : "text-[11px]";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* TraceX mark: a case tab with a trace/connection path — evokes a
          folder tab index and a network trace at once. */}
      <div className={`${iconDim} flex-shrink-0`}>
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
          <rect x="1.5" y="6.5" width="37" height="30" rx="2.5" fill="#083344" />
          <path d="M1.5 12.5H13L15.5 8.5H1.5V12.5Z" fill="#083344" />
          <rect x="4.5" y="9.5" width="31" height="24" rx="1.5" fill="#020617" />
          <path
            d="M9 27L14.5 20L18.5 24L25.5 15L31 21"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="9" cy="27" r="1.8" fill="#22D3EE" />
          <circle cx="18.5" cy="24" r="1.8" fill="#22D3EE" />
          <circle cx="25.5" cy="15" r="1.8" fill="#22D3EE" />
          <circle cx="31" cy="21" r="1.8" fill="#F87171" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span className={`${titleSize} font-display font-semibold text-text tracking-tight`}>
          TraceX
        </span>
        {showSubtitle && (
          <span className={`${subSize} text-textDim leading-tight tracking-normal mt-0.5`}>
            Cyber Fraud Case Room
          </span>
        )}
      </div>
    </div>
  );
}

import React from "react";

export default function Logo({ size = "md", showSubtitle = true, className = "" }) {
  const isSmall = size === "sm";
  const isLarge = size === "lg";

  const iconDim = isSmall ? "w-6 h-6" : isLarge ? "w-10 h-10" : "w-8 h-8";
  const titleSize = isSmall ? "text-[13px]" : isLarge ? "text-[18px]" : "text-[15px]";
  const subSize = isSmall ? "text-[9.5px]" : "text-[11px]";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* TraceX Vector Shield Mark */}
      <div className={`${iconDim} flex-shrink-0 flex items-center justify-center`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="logoShield" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F4C81" />
              <stop offset="100%" stopColor="#0A3258" />
            </linearGradient>
          </defs>
          <path
            d="M24 4L8 10V22C8 32.5 14.8 42.2 24 44C33.2 42.2 40 32.5 40 22V10L24 4Z"
            fill="url(#logoShield)"
          />
          <path
            d="M24 11V25M24 25L16 33M24 25L32 33M16 18L24 25M32 18L24 25"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="11" r="2.5" fill="#38BDF8" />
          <circle cx="16" cy="18" r="2" fill="#BAE6FD" />
          <circle cx="32" cy="18" r="2" fill="#BAE6FD" />
          <circle cx="16" cy="33" r="2.25" fill="#38BDF8" />
          <circle cx="32" cy="33" r="2.25" fill="#38BDF8" />
          <circle cx="24" cy="25" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${titleSize} font-bold text-text tracking-tight leading-tight`}>
            Trace<span className="text-accent">X</span>
          </span>
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-accentSoft text-accent border border-accentBorder font-semibold">
            Ops Room
          </span>
        </div>
        {showSubtitle && (
          <span className={`${subSize} text-textDim leading-tight tracking-normal`}>
            Cyber Fraud Operations Console
          </span>
        )}
      </div>
    </div>
  );
}

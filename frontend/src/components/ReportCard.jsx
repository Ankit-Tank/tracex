import React from "react";
import { CheckCircle2, Download, FileText, Loader2, ShieldCheck, Lock } from "lucide-react";

export default function ReportCard({
  icon: Icon = FileText,
  title,
  description,
  bullets = [],
  buttonLabel,
  onGenerate,
  isGenerating = false,
  sha256 = null,
  footerNote = null,
}) {
  return (
    <div className="bg-bg border border-border rounded p-6 flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        {/* Card Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded bg-accentSoft border border-accentBorder text-accent flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-text leading-tight">
              {title}
            </h2>
            <p className="text-[12px] text-textDim mt-1 leading-normal">
              {description}
            </p>
          </div>
        </div>

        {/* Bullet List */}
        <div className="pt-2 border-t border-border">
          <div className="text-[11px] font-semibold text-textFaint uppercase tracking-wider mb-2.5">
            Included Document Sections & Intelligence
          </div>
          <ul className="space-y-2 text-[12.5px] text-text">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-riskLow flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-border">
        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 px-4 bg-accent hover:bg-accentHover disabled:opacity-60 text-white rounded text-[13px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling PDF document...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>

        {/* Footer Note (if any, e.g. for takedown) */}
        {footerNote && (
          <p className="text-[11px] text-textFaint italic text-center">
            {footerNote}
          </p>
        )}

        {/* SHA-256 Hash Display */}
        {sha256 && (
          <div className="p-2.5 bg-bgSubtle border border-border rounded text-[11px] text-textDim flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-text font-semibold uppercase tracking-wider text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-riskLow" />
              <span>Cryptographic Evidentiary Stamp (SHA-256)</span>
            </div>
            <div className="font-mono text-[10.5px] text-text break-all select-all">
              {sha256}
            </div>
            <span className="text-[9.5px] text-textFaint">
              Certified for Section 65B Indian Evidence Act submission
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";

const LEVELS = {
  critical: { label: "Critical Risk", fg: "text-riskCritical", bg: "bg-riskCriticalBg", dot: "bg-riskCritical" },
  high: { label: "High Risk", fg: "text-riskHigh", bg: "bg-riskHighBg", dot: "bg-riskHigh" },
  medium: { label: "Medium Risk", fg: "text-riskMed", bg: "bg-riskMedBg", dot: "bg-riskMed" },
  med: { label: "Medium Risk", fg: "text-riskMed", bg: "bg-riskMedBg", dot: "bg-riskMed" },
  low: { label: "Low Risk", fg: "text-riskLow", bg: "bg-riskLowBg", dot: "bg-riskLow" },
};

export default function RiskTag({ level }) {
  const norm = (level || "").toLowerCase();
  const cfg = LEVELS[norm];

  if (!cfg) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium bg-bgMuted text-textDim border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-textFaint" />
        Pending scoring
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium ${cfg.bg} ${cfg.fg} border border-current/20`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

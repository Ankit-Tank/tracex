import React from "react";

export default function RiskTag({ level }) {
  const norm = (level || "").toLowerCase();

  if (norm === "high") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-riskHighBg text-riskHigh border border-riskHigh/20">
        <span className="w-1.5 h-1.5 rounded-full bg-riskHigh"></span>
        High Risk
      </span>
    );
  }

  if (norm === "medium" || norm === "med") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-riskMedBg text-riskMed border border-riskMed/20">
        <span className="w-1.5 h-1.5 rounded-full bg-riskMed"></span>
        Medium Risk
      </span>
    );
  }

  if (norm === "low") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-riskLowBg text-riskLow border border-riskLow/20">
        <span className="w-1.5 h-1.5 rounded-full bg-riskLow"></span>
        Low Risk
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-bgMuted text-textDim border border-border">
      <span className="w-1.5 h-1.5 rounded-full bg-textFaint"></span>
      Pending Scoring
    </span>
  );
}

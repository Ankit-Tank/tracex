import React from "react";
import { MapPin, Info } from "lucide-react";

export default function HeatmapGrid({ heatmap = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="py-6 text-center text-textDim text-[13px]">
        Loading fraud density heatmap...
      </div>
    );
  }

  const getTileStyles = (level) => {
    const norm = (level || "").toLowerCase();
    if (norm === "high") {
      return "bg-riskHighBg text-riskHigh border-riskHigh/30";
    }
    if (norm === "medium" || norm === "med") {
      return "bg-riskMedBg text-riskMed border-riskMed/30";
    }
    if (norm === "low") {
      return "bg-riskLowBg text-riskLow border-riskLow/30";
    }
    return "bg-bgSubtle text-textDim border-border";
  };

  return (
    <div className="space-y-3">
      {/* 6-column grid of pastel tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {heatmap.map((item) => (
          <div
            key={item.district}
            className={`p-2.5 rounded border transition-colors flex flex-col justify-between ${getTileStyles(
              item.level
            )}`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[11.5px] font-semibold truncate leading-tight text-text">
                {item.district}
              </span>
              <MapPin className="w-3 h-3 opacity-60 flex-shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                {item.level || "norm"}
              </span>
              <span className="text-[14px] font-bold font-mono">
                {item.case_count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend and offline verification note */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11.5px] text-textDim">
        <div className="flex items-center gap-3">
          <span className="text-textFaint uppercase text-[10px] tracking-wider font-semibold">
            Density:
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-riskLowBg border border-riskLow/30"></span>
            <span>Low (1-2)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-riskMedBg border border-riskMed/30"></span>
            <span>Medium (3-5)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-riskHighBg border border-riskHigh/30"></span>
            <span>High (6+)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-textFaint text-[11px]">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>runs fully offline, from locally bundled lookups</span>
        </div>
      </div>
    </div>
  );
}

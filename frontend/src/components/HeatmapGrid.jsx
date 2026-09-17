import React, { useState } from "react";
import { MapPin, Info, Flame, X, ShieldAlert } from "lucide-react";

export default function HeatmapGrid({
  heatmap = [],
  isLoading = false,
  selectedDistrict = null,
  onSelectDistrict = () => {},
}) {
  const [filterLevel, setFilterLevel] = useState("all");

  if (isLoading) {
    return (
      <div className="py-10 bg-bgSubtle border border-border rounded-sm text-center text-textDim text-[13px]">
        Analyzing jurisdictional fraud telemetry...
      </div>
    );
  }

  // Filter items by density level tab
  const filteredHeatmap = (heatmap || []).filter((item) => {
    if (filterLevel === "all") return true;
    return (item.level || "").toLowerCase() === filterLevel;
  });

  // Calculate top hotspot district
  const sortedByCount = [...(heatmap || [])].sort((a, b) => b.case_count - a.case_count);
  const topHotspot = sortedByCount[0];
  const totalHeatmapCases = (heatmap || []).reduce((acc, curr) => acc + curr.case_count, 0);

  const getTileStyles = (level, isSelected) => {
    const norm = (level || "").toLowerCase();
    if (isSelected) {
      return "ring-2 ring-accent border-accent bg-accentSoft shadow-sm";
    }
    if (norm === "high") {
      return "bg-riskHighBg/60 text-text border-riskHigh/30 hover:border-riskHigh hover:bg-riskHighBg";
    }
    if (norm === "medium" || norm === "med") {
      return "bg-riskMedBg/60 text-text border-riskMed/30 hover:border-riskMed hover:bg-riskMedBg";
    }
    return "bg-bgSubtle text-text border-border hover:border-borderStrong hover:bg-bgMuted";
  };

  const getMeterColor = (level) => {
    const norm = (level || "").toLowerCase();
    if (norm === "high") return "bg-riskHigh";
    if (norm === "medium" || norm === "med") return "bg-riskMed";
    return "bg-riskLow";
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Hotspot Summary & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-bgSubtle border border-border rounded-sm text-[12.5px]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-riskHighBg text-riskHigh flex items-center justify-center flex-shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-text">
              Regional Fraud Telemetry:
            </span>{" "}
            {topHotspot ? (
              <span>
                Primary concentration detected in{" "}
                <strong className="text-riskHigh font-bold">{topHotspot.district}</strong>{" "}
                ({topHotspot.case_count} cases) across {heatmap.length} resolved jurisdictions.
              </span>
            ) : (
              <span>Resolved from static IFSC and Postal PIN databases.</span>
            )}
          </div>
        </div>

        {/* Level Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {["all", "high", "medium", "low"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 text-[11px] uppercase font-mono rounded transition-colors cursor-pointer ${
                filterLevel === lvl
                  ? "bg-accent text-white font-bold"
                  : "bg-bg text-textDim hover:text-text border border-border"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Selected District Filter Banner */}
      {selectedDistrict && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-accentSoft border border-accentBorder rounded-sm text-[12px] text-accent font-medium">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span>
              Filtering priority cases for <strong>{selectedDistrict}</strong>
            </span>
          </div>
          <button
            onClick={() => onSelectDistrict(null)}
            className="flex items-center gap-1 text-[11px] underline hover:text-accentHover cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear filter</span>
          </button>
        </div>
      )}

      {/* Interactive 6-column Grid of District Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {filteredHeatmap.map((item) => {
          const isSelected = selectedDistrict?.toLowerCase() === item.district.toLowerCase();
          const percent = Math.min(100, Math.round((item.case_count / Math.max(1, topHotspot?.case_count || 1)) * 100));

          return (
            <div
              key={item.district}
              onClick={() => onSelectDistrict(isSelected ? null : item.district)}
              className={`p-3 rounded-sm border cursor-pointer transition-all flex flex-col justify-between select-none ${getTileStyles(
                item.level,
                isSelected
              )}`}
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[12px] font-bold text-text truncate">
                    {item.district}
                  </span>
                  <MapPin className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-[10px] uppercase font-mono font-semibold tracking-wider opacity-70">
                    {item.level || "low"}
                  </span>
                  <span className="text-[16px] font-display font-semibold text-text">
                    {item.case_count}
                  </span>
                </div>
              </div>

              {/* Visual Intensity Bar */}
              <div className="mt-2.5 w-full bg-bgMuted h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getMeterColor(item.level)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Verification Footnote */}
      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11.5px] text-textDim border-t border-border">
        <div className="flex items-center gap-4">
          <span className="text-textFaint uppercase text-[10px] tracking-wider font-semibold">
            Density Legend:
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-riskLow"></span>
            <span>Low (1-2)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-riskMed"></span>
            <span>Medium (3-5)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-riskHigh"></span>
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

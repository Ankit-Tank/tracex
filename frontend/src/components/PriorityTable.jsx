import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldAlert, MapPin, Eye, EyeOff } from "lucide-react";
import RiskTag from "./RiskTag";

const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

const RAIL_COLOR = {
  critical: "bg-riskCritical",
  high: "bg-riskHigh",
  medium: "bg-riskMed",
  med: "bg-riskMed",
  low: "bg-riskLow",
};

function scoreOf(c) {
  if (c.risk_score !== null && c.risk_score !== undefined) return Math.round(c.risk_score);
  const level = (c.risk_level || "").toLowerCase();
  if (level === "critical") return 95;
  if (level === "high") return 80;
  if (level === "medium" || level === "med") return 50;
  if (level === "low") return 20;
  return 0;
}

export default function PriorityTable({ cases = [], isLoading = false, selectedDistrict = null }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  // Filter by selected district if clicked from heatmap
  const filteredCases = selectedDistrict
    ? cases.filter((c) => (c.district || "").toLowerCase() === selectedDistrict.toLowerCase())
    : cases;

  // Rank by actual risk score/level so "top 5" is genuinely the highest priority,
  // not just the first 5 rows the API happened to return.
  const rankedCases = [...filteredCases].sort((a, b) => scoreOf(b) - scoreOf(a));

  const displayedCases = showAll ? rankedCases : rankedCases.slice(0, 5);

  if (isLoading) {
    return (
      <div className="py-12 bg-bgSubtle border border-border rounded-sm text-center text-textDim text-[13px]">
        Loading high-priority incident queue...
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="py-12 bg-bgSubtle border border-border rounded-sm text-center text-textDim text-[13px]">
        No cases registered yet. Click "+ New investigation" above to begin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* List Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[12px] uppercase tracking-wider font-semibold text-text">
            {selectedDistrict
              ? `Filtered by district: ${selectedDistrict} (${filteredCases.length})`
              : `Top ${Math.min(5, rankedCases.length)} high-priority cases`}
          </h2>
          <span className="text-[11px] font-mono text-textFaint bg-bgSubtle px-2 py-0.5 rounded-sm border border-border">
            {filteredCases.length} total active
          </span>
        </div>

        {rankedCases.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[12px] font-medium text-accent hover:text-accentHover flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {showAll ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Show top 5 only</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View all ({rankedCases.length}) cases</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Evidence-log style priority list */}
      <div className="border border-border rounded-sm bg-bg divide-y divide-border overflow-hidden">
        {displayedCases.map((c, idx) => {
          const scamLabel = SCAM_TYPE_LABELS[c.scam_type] || c.scam_type;
          const score = scoreOf(c);
          const isTop1 = idx === 0 && !selectedDistrict;
          const railColor = RAIL_COLOR[(c.risk_level || "").toLowerCase()] || "bg-textFaint";

          return (
            <div
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}/graph`)}
              className="flex items-stretch gap-0 hover:bg-bgSubtle cursor-pointer transition-colors group"
            >
              {/* Risk rail */}
              <div className={`w-1 flex-shrink-0 ${railColor}`} />

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3.5 min-w-0">
                {/* Case ID + victim */}
                <div className="flex items-center gap-2.5 min-w-0 sm:w-[220px] flex-shrink-0">
                  {isTop1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-riskCritical animate-pulse flex-shrink-0" title="Highest risk case" />
                  )}
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-accent text-[13px] leading-tight">{c.case_number}</div>
                    <div className="font-semibold text-text text-[13px] leading-tight truncate">{c.victim_name}</div>
                  </div>
                </div>

                {/* Risk + score */}
                <div className="flex items-center gap-2.5 sm:w-[190px] flex-shrink-0">
                  <RiskTag level={c.risk_level} />
                  {c.risk_score !== null && c.risk_score !== undefined && (
                    <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-textDim">
                      <span>{score}/100</span>
                      <div className="w-10 h-1.5 bg-bgMuted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score >= 70 ? "bg-riskHigh" : score >= 40 ? "bg-riskMed" : "bg-riskLow"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Rationale */}
                <div className="flex-1 min-w-0 text-[12.5px]">
                  {c.why_flagged ? (
                    <span className="inline-flex items-center gap-1.5 text-text">
                      <ShieldAlert className="w-3.5 h-3.5 text-riskMed flex-shrink-0" />
                      <span className="truncate">{c.why_flagged}</span>
                    </span>
                  ) : (
                    <span className="text-textFaint italic">Awaiting correlation</span>
                  )}
                </div>

                {/* District + scam type */}
                <div className="flex items-center gap-3 sm:w-[210px] flex-shrink-0 text-[12px] text-textDim">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-textFaint" />
                    {c.district || "Pending resolution"}
                  </span>
                  <span className="hidden lg:inline text-textFaint">·</span>
                  <span className="hidden lg:inline">{scamLabel}</span>
                </div>

                {/* Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/cases/${c.id}/graph`);
                  }}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-accent group-hover:text-white group-hover:bg-accent rounded-sm border border-accentBorder transition-all self-start sm:self-center"
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

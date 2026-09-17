import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, ShieldAlert, MapPin, Eye, EyeOff } from "lucide-react";
import RiskTag from "./RiskTag";

const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

export default function PriorityTable({ cases = [], isLoading = false, selectedDistrict = null }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  // Filter by selected district if clicked from heatmap
  const filteredCases = selectedDistrict
    ? cases.filter((c) => (c.district || "").toLowerCase() === selectedDistrict.toLowerCase())
    : cases;

  // Display top 5 by default, or all if toggled
  const displayedCases = showAll ? filteredCases : filteredCases.slice(0, 5);

  if (isLoading) {
    return (
      <div className="py-12 bg-bgSubtle border border-border rounded-lg text-center text-textDim text-[13px]">
        Loading high-priority incident queue...
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="py-12 bg-bgSubtle border border-border rounded-lg text-center text-textDim text-[13px]">
        No cases registered yet. Click "+ New investigation" above to begin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] uppercase tracking-wider font-semibold text-text">
            {selectedDistrict
              ? `Filtered by District: ${selectedDistrict} (${filteredCases.length})`
              : `Top ${Math.min(5, filteredCases.length)} High-Priority Cases`}
          </span>
          <span className="text-[11px] font-mono text-textFaint bg-bgSubtle px-2 py-0.5 rounded border border-border">
            {filteredCases.length} total active
          </span>
        </div>

        {filteredCases.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[12px] font-medium text-accent hover:text-accentHover flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {showAll ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Show Top 5 Only</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>View All ({filteredCases.length}) Cases</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Modern High-Priority Cases Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-bg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-bgSubtle border-b border-border text-[11px] uppercase tracking-wider font-semibold text-textFaint select-none">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Victim</th>
                <th className="py-3 px-4">Risk Assessment</th>
                <th className="py-3 px-4">Key Detection Factor / Rationale</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Scam Type</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedCases.map((c, idx) => {
                const scamLabel = SCAM_TYPE_LABELS[c.scam_type] || c.scam_type;
                const score = Math.round(c.risk_score || (c.risk_level === "high" ? 85 : c.risk_level === "medium" ? 55 : 25));
                const isTop1 = idx === 0 && !selectedDistrict;

                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}/graph`)}
                    className={`hover:bg-bgSubtle cursor-pointer transition-colors group ${
                      isTop1 ? "bg-urgentBg/30" : ""
                    }`}
                  >
                    {/* Case ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-accent whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isTop1 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-riskHigh animate-pulse" title="Highest Risk Case" />
                        )}
                        <span>{c.case_number}</span>
                      </div>
                    </td>

                    {/* Victim Name */}
                    <td className="py-3.5 px-4 font-semibold text-text whitespace-nowrap">
                      {c.victim_name}
                    </td>

                    {/* Risk Level + Score Meter */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <RiskTag level={c.risk_level} />
                        {c.risk_score !== null && (
                          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-textDim">
                            <span>{score}/100</span>
                            <div className="w-12 h-1.5 bg-bgMuted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  score >= 70
                                    ? "bg-riskHigh"
                                    : score >= 40
                                    ? "bg-riskMed"
                                    : "bg-riskLow"
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Key Rationale */}
                    <td className="py-3.5 px-4 text-text max-w-sm">
                      {c.why_flagged ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text bg-bgSubtle px-2 py-0.5 rounded border border-border">
                          <ShieldAlert className="w-3.5 h-3.5 text-riskMed flex-shrink-0" />
                          <span className="truncate">{c.why_flagged}</span>
                        </span>
                      ) : (
                        <span className="text-textFaint text-[12px] italic">
                          Awaiting correlation
                        </span>
                      )}
                    </td>

                    {/* District */}
                    <td className="py-3.5 px-4 text-textDim whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[12px]">
                        <MapPin className="w-3.5 h-3.5 text-textFaint" />
                        <span>{c.district || "Pending resolution"}</span>
                      </div>
                    </td>

                    {/* Scam Type */}
                    <td className="py-3.5 px-4 text-textDim whitespace-nowrap text-[12px]">
                      {scamLabel}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${c.id}/graph`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-accent hover:text-white hover:bg-accent rounded border border-accentBorder transition-all"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function UrgentBanner({ cases = [] }) {
  // Find highest priority urgent case with high risk and freeze-relevant indicator
  const urgentCase = cases.find((c) => {
    if (c.risk_level !== "high" && c.risk_level !== "High") return false;
    const why = (c.why_flagged || "").toLowerCase();
    // Check for freeze-relevant indicators (e.g. upi, account, shared mule, velocity)
    const isFreezeRelevant =
      why.includes("upi") ||
      why.includes("account") ||
      why.includes("freeze") ||
      why.includes("shared_") ||
      why.includes("rapid") ||
      why.includes("mule") ||
      why.length > 0;
    return isFreezeRelevant;
  });

  if (!urgentCase) {
    return null;
  }

  return (
    <div className="bg-urgentBg border border-urgentBorder rounded px-4 py-3 flex items-center justify-between text-[13px] text-urgentText transition-all">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-urgentText" />
        <div>
          <span className="font-semibold mr-2">Action Required:</span>
          <span>
            Case <strong className="font-mono font-bold">{urgentCase.case_number}</strong> —{" "}
            {urgentCase.why_flagged || "High-confidence multi-hop entity link flagged for immediate freeze"}
          </span>
        </div>
      </div>
      <Link
        to={`/cases/${urgentCase.id}/graph`}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold text-urgentText border border-urgentText/30 rounded hover:bg-urgentText/10 transition-colors"
      >
        <span>Open case</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

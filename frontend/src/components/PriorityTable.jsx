import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import RiskTag from "./RiskTag";

const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

export default function PriorityTable({ cases = [], isLoading = false }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="py-8 text-center text-textDim text-[13px]">
        Loading priority queue...
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="py-8 text-center text-textDim text-[13px]">
        No cases registered yet. Start by clicking "+ New investigation" above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider font-semibold text-textFaint">
            <th className="py-2.5 pr-4 pl-1">Case ID</th>
            <th className="py-2.5 px-4">Victim</th>
            <th className="py-2.5 px-4">Risk Level</th>
            <th className="py-2.5 px-4">Why Flagged</th>
            <th className="py-2.5 px-4">Scam Type</th>
            <th className="py-2.5 pl-4 pr-1 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cases.map((c) => {
            const scamLabel = SCAM_TYPE_LABELS[c.scam_type] || c.scam_type;

            return (
              <tr
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}/graph`)}
                className="hover:bg-bgSubtle cursor-pointer transition-colors group"
              >
                <td className="py-3 pr-4 pl-1 font-mono font-medium text-text whitespace-nowrap">
                  {c.case_number}
                </td>
                <td className="py-3 px-4 text-text whitespace-nowrap font-medium">
                  {c.victim_name}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <RiskTag level={c.risk_level} />
                </td>
                <td className="py-3 px-4 text-textDim max-w-xs truncate">
                  {c.why_flagged || (
                    <span className="text-textFaint italic">No correlation links yet</span>
                  )}
                </td>
                <td className="py-3 px-4 text-textDim whitespace-nowrap">
                  {scamLabel}
                </td>
                <td className="py-3 pl-4 pr-1 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-accent group-hover:underline">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 text-accent" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

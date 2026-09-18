import React from "react";

export default function StatRow({ stats = {} }) {
  const items = [
    {
      label: "High-risk cases",
      value: stats.high_risk_cases ?? 0,
      highlight: (stats.high_risk_cases || 0) > 0,
      highlightColor: "text-riskHigh",
    },
    {
      label: "Active case load",
      value: stats.active_cases ?? 0,
    },
    {
      label: "Awaiting correlation",
      value: stats.awaiting_correlation ?? 0,
      highlight: (stats.awaiting_correlation || 0) > 0,
      highlightColor: "text-riskMed",
    },
    {
      label: "Closed this month",
      value: stats.closed_this_month ?? 0,
      highlightColor: "text-statusSuccess",
    },
  ];

  return (
    <div className="border border-border rounded-sm bg-bg">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {items.map((item) => (
          <div key={item.label} className="px-5 py-4">
            <div className="text-[11px] uppercase tracking-wider font-medium text-textDim">
              {item.label}
            </div>
            <div
              className={`text-3xl font-display font-semibold mt-1.5 ${
                item.highlight ? item.highlightColor : "text-text"
              }`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

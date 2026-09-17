import React from "react";

export default function StatRow({ stats = {} }) {
  const items = [
    {
      label: "Critical priority cases",
      value: stats.critical_cases ?? 0,
      highlight: (stats.critical_cases || 0) > 0,
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
    },
  ];

  return (
    <div className="py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {items.map((item, idx) => (
          <div
            key={item.label}
            className={`py-3 ${idx === 0 ? "md:pr-6" : idx === items.length - 1 ? "md:pl-6" : "md:px-6"}`}
          >
            <div className="text-[11.5px] uppercase tracking-wider font-medium text-textDim">
              {item.label}
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
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

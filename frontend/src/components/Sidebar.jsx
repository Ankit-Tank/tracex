import React from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { Shield, Home, Network, FileText } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const { caseId } = useParams();

  // If a specific caseId is in the URL, preserve it; otherwise fallback to 1
  const activeCaseId = caseId || "1";

  const navItems = [
    {
      label: "Home",
      to: "/",
      icon: Home,
      exact: true,
    },
    {
      label: "Connections & Graph",
      to: `/cases/${activeCaseId}/graph`,
      icon: Network,
      matchPrefix: "/cases/",
      matchSuffix: "/graph",
    },
    {
      label: "Reports",
      to: `/cases/${activeCaseId}/reports`,
      icon: FileText,
      matchPrefix: "/cases/",
      matchSuffix: "/reports",
    },
  ];

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    if (item.matchPrefix && item.matchSuffix) {
      return (
        location.pathname.startsWith(item.matchPrefix) &&
        location.pathname.includes(item.matchSuffix)
      );
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="w-[200px] min-w-[200px] bg-bgSubtle border-r border-border h-screen flex flex-col select-none">
      {/* Brand Header */}
      <div className="h-[56px] px-4 flex items-center gap-2.5 border-b border-border">
        <div className="w-7 h-7 rounded bg-accent text-white flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-text tracking-tight leading-tight">
            TraceX
          </span>
          <span className="text-[10px] text-textFaint leading-none uppercase tracking-wider font-mono">
            Cyber Ops
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        <div className="px-2 pb-1.5 pt-1 text-[10px] uppercase font-semibold text-textFaint tracking-wider">
          Workspace
        </div>

        {navItems.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={`flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] rounded-r transition-colors ${
                active
                  ? "bg-accentSoft text-accent font-semibold border-l-[3px] border-accent"
                  : "text-textDim hover:text-text hover:bg-bgMuted border-l-[3px] border-transparent font-medium"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-accent" : "text-textDim"}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Status Tag */}
      <div className="p-3 border-t border-border">
        <div className="bg-bg border border-border rounded px-2.5 py-2 text-[11px] text-textDim flex flex-col gap-0.5">
          <span className="text-text font-medium text-[11px]">MP Cyber Cell</span>
          <span className="text-[10px] text-textFaint font-mono">Console v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}

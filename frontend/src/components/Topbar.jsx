import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Search, Bell, User, Settings, LogOut, ChevronRight } from "lucide-react";
import { getOfficer, clearAuth } from "../api/client";

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Cell",
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate("/login");
  };

  // Derive breadcrumbs from path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === "/") {
      return ["TraceX", "Operations Room", "Priority Queue"];
    }
    if (path.includes("/graph")) {
      return ["TraceX", `Case #${caseId || "4471"}`, "Entity Correlation Graph"];
    }
    if (path.includes("/reports")) {
      return ["TraceX", `Case #${caseId || "4471"}`, "Investigative Reports"];
    }
    return ["TraceX", "Console"];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-[56px] bg-bg border-b border-border px-5 flex items-center justify-between z-20">
      {/* Left: Breadcrumb Page Title */}
      <div className="flex items-center gap-1.5 text-[12.5px]">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-textFaint" />}
            <span
              className={`${
                idx === breadcrumbs.length - 1
                  ? "font-semibold text-text"
                  : "text-textDim hover:text-text cursor-default"
              }`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right: Search, Notifications, Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-textFaint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases, UPI, IMEI, phone..."
            className="w-56 pl-8 pr-3 py-1 text-[12px] bg-bgSubtle border border-border rounded-full text-text placeholder-textFaint focus:outline-none focus:border-accent focus:bg-bg transition-colors"
          />
        </div>

        {/* Notifications Icon */}
        <button
          title="Alerts & Feeds"
          className="w-8 h-8 rounded flex items-center justify-center text-textDim hover:text-text hover:bg-bgMuted transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-riskHigh rounded-full absolute top-2 right-2"></span>
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded hover:bg-bgMuted transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-semibold">
              {officer.name ? officer.name.charAt(0).toUpperCase() : "O"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[12px] font-medium text-text leading-tight">
                {officer.name || "Officer"}
              </span>
              <span className="text-[10px] text-textFaint font-mono leading-none">
                {officer.badge_id || "IO"}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-bg border border-border rounded shadow-sm py-1.5 z-50 text-[12.5px]">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="font-semibold text-text">{officer.name}</p>
                <p className="text-[11px] text-textDim font-mono">{officer.badge_id}</p>
                <p className="text-[10.5px] text-textFaint">{officer.station_name}</p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-textDim hover:text-text hover:bg-bgMuted flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>My profile</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-textDim hover:text-text hover:bg-bgMuted flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </button>

              <div className="border-t border-border my-1"></div>

              <button
                onClick={handleSignOut}
                className="w-full px-3 py-1.5 text-left text-riskHigh hover:bg-riskHighBg flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 text-riskHigh" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

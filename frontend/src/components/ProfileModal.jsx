import React from "react";
import {
  X,
  User,
  Shield,
  BadgeCheck,
  Building,
  Key,
  Clock,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { getOfficer, getToken, clearAuth } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function ProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Operations Room",
  };

  const token = getToken() || "";
  const tokenSnippet = token ? `${token.substring(0, 12)}...${token.substring(token.length - 8)}` : "None";

  const handleSignOut = () => {
    clearAuth();
    onClose();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg w-full max-w-md border border-border rounded-sm shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bgSubtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[12px] font-bold">
              {officer.name ? officer.name.charAt(0).toUpperCase() : "O"}
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-text leading-tight">
                Officer Security Profile
              </h2>
              <p className="text-[11px] text-textDim leading-tight">
                National Cybercrime Reporting Portal • Node MP-01
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-textDim hover:text-text hover:bg-bgMuted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-5 space-y-4 text-[12.5px]">
          {/* Identity Grid */}
          <div className="bg-bgSubtle border border-border rounded-sm p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-[11px] uppercase font-semibold text-textFaint tracking-wider">
                Full Officer Name
              </span>
              <span className="font-semibold text-text">{officer.name || "A. Sharma"}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-[11px] uppercase font-semibold text-textFaint tracking-wider">
                Badge / Service ID
              </span>
              <span className="font-mono font-bold text-accent px-2 py-0.5 bg-accentSoft rounded border border-accentBorder">
                {officer.badge_id || "MP-IO-4471"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-[11px] uppercase font-semibold text-textFaint tracking-wider">
                Station & Jurisdiction
              </span>
              <span className="font-medium text-text">{officer.station_name || "Bhopal Cyber Cell"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-semibold text-textFaint tracking-wider">
                Security Clearance
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-riskLow bg-riskLowBg px-2 py-0.5 rounded border border-riskLow/30">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Level-3 Cyber Ops</span>
              </span>
            </div>
          </div>

          {/* Session Integrity */}
          <div className="border border-border rounded-sm p-3 space-y-1.5 text-[11.5px]">
            <div className="flex items-center justify-between text-text">
              <span className="font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-accent" />
                Active Bearer Token
              </span>
              <span className="font-mono text-[10.5px] text-textDim">{tokenSnippet}</span>
            </div>
            <div className="flex items-center justify-between text-textDim text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-textFaint" />
                Session Integrity
              </span>
              <span className="text-riskLow font-medium">Verified & Active</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-bgSubtle flex items-center justify-between">
          <span className="text-[11px] text-textFaint">
            Session authenticated via JWT
          </span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 bg-riskHighBg hover:bg-riskHigh text-riskHigh hover:text-white border border-riskHigh/30 rounded text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

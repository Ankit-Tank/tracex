import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams, NavLink } from "react-router-dom";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Plus,
  Network,
  FileText,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getOfficer, clearAuth, apiClient } from "../api/client";
import Logo from "./Logo";
import NotificationsPopover from "./NotificationsPopover";
import ProfileModal from "./ProfileModal";

export default function Topbar({ onOpenNewInvestigation }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const dropdownRef = useRef(null);
  const notifButtonRef = useRef(null);
  const searchRef = useRef(null);

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Cell",
  };

  const activeCaseId = caseId || "1";

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const cases = await apiClient.get("cases");
        const q = searchQuery.toLowerCase().trim();
        const matches = (cases || []).filter(
          (c) =>
            c.case_number?.toLowerCase().includes(q) ||
            c.victim_name?.toLowerCase().includes(q) ||
            c.district?.toLowerCase().includes(q) ||
            c.scam_type?.toLowerCase().includes(q)
        );
        setSearchResults(matches.slice(0, 5));
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search query failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate("/login");
  };

  const navTabs = [
    {
      label: "Operations Queue",
      to: "/",
      icon: Layers,
      isActive: location.pathname === "/",
    },
    {
      label: "Connections & Graph",
      to: `/cases/${activeCaseId}/graph`,
      icon: Network,
      isActive: location.pathname.includes("/graph"),
    },
    {
      label: "Investigative Reports",
      to: `/cases/${activeCaseId}/reports`,
      icon: FileText,
      isActive: location.pathname.includes("/reports"),
    },
  ];

  return (
    <header className="bg-bgSubtle border-b border-border px-6 z-30 sticky top-0">
      <div className="h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <NavLink to="/" className="hover:opacity-90 transition-opacity">
          <Logo size="sm" showSubtitle={true} />
        </NavLink>

        {/* Right Controls: Search, New Investigation, Notifications, Profile */}
        <div className="flex items-center gap-3">
        {/* Global Live Search Box */}
        <div className="relative" ref={searchRef}>
          <Search className="w-3.5 h-3.5 text-textFaint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            placeholder="Search cases, victims, districts..."
            className="w-56 pl-8 pr-3 py-1.5 text-[12px] bg-bg border border-border rounded-sm text-text placeholder-textFaint focus:outline-none focus:border-accent focus:w-64 transition-all"
          />

          {/* Search Dropdown Results */}
          {showSearchResults && (
            <div className="absolute right-0 mt-1.5 w-72 bg-bg border border-border rounded-sm shadow-xl py-1 z-50 text-[12px]">
              <div className="px-3 py-1.5 text-[10.5px] uppercase tracking-wider font-semibold text-textFaint border-b border-border">
                Matching Cases ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-textDim text-[12px]">
                  No matching cases found
                </div>
              ) : (
                searchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                      navigate(`/cases/${c.id}/graph`);
                    }}
                    className="px-3 py-2 hover:bg-bgSubtle cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-accent">{c.case_number}</div>
                      <div className="text-text font-medium">{c.victim_name}</div>
                      <div className="text-[10.5px] text-textFaint">{c.district || "Pending district"}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-textFaint" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Topbar "+ New investigation" CTA Button */}
        <button
          onClick={onOpenNewInvestigation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accentHover text-white rounded-sm text-[12px] font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New investigation</span>
        </button>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            ref={notifButtonRef}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Operational Alerts"
            className="w-8 h-8 rounded-sm flex items-center justify-center text-textDim hover:text-text hover:bg-bg border border-border transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-riskHigh rounded-full absolute top-1 right-1 border-2 border-bgSubtle"></span>
          </button>

          <NotificationsPopover
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            anchorRef={notifButtonRef}
          />
        </div>

        {/* Officer Profile Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-sm hover:bg-bg transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded-sm bg-accent text-white flex items-center justify-center text-[11px] font-bold font-display">
              {officer.name ? officer.name.charAt(0).toUpperCase() : "O"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-[12px] font-semibold text-text leading-tight">
                {officer.name || "Officer"}
              </span>
              <span className="text-[10px] text-textFaint font-mono leading-none">
                {officer.badge_id || "IO"}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-bg border border-border rounded-sm shadow-xl py-1.5 z-50 text-[12.5px] select-none">
              <div className="px-3.5 py-2.5 border-b border-border mb-1 bg-bgSubtle">
                <p className="font-semibold text-text">{officer.name}</p>
                <p className="text-[11px] text-accent font-mono font-medium">{officer.badge_id}</p>
                <p className="text-[10.5px] text-textFaint mt-0.5">{officer.station_name}</p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setProfileModalOpen(true);
                }}
                className="w-full px-3.5 py-2 text-left text-textDim hover:text-text hover:bg-bgSubtle flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-accent" />
                <span>My profile & credentials</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  alert("Preferences: Sound alerts enabled • High-contrast map tiles enabled • Section 65B verification stamp active");
                }}
                className="w-full px-3.5 py-2 text-left text-textDim hover:text-text hover:bg-bgSubtle flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-textDim" />
                <span>Preferences</span>
              </button>

              <div className="border-t border-border my-1"></div>

              <button
                onClick={handleSignOut}
                className="w-full px-3.5 py-2 text-left text-riskHigh hover:bg-riskHighBg flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-riskHigh" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Folder-tab navigation strip — replaces the sidebar */}
      <nav className="flex items-end gap-1 -mb-px">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-t border-x rounded-t-sm transition-all ${
                tab.isActive
                  ? "bg-bg text-text font-semibold border-border border-b-bg -mb-px"
                  : "bg-transparent text-textDim hover:text-text border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.isActive ? "text-signal" : "text-textFaint"}`} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>


      {/* Officer Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </header>
  );
}

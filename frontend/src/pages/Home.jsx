import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, RefreshCw, Shield, Layers } from "lucide-react";
import apiClient, { getOfficer, setOfficer } from "../api/client";
import UrgentBanner from "../components/UrgentBanner";
import StatRow from "../components/StatRow";
import PriorityTable from "../components/PriorityTable";
import EvidenceTray from "../components/EvidenceTray";
import HeatmapGrid from "../components/HeatmapGrid";

export default function Home() {
  // Use global openNewInvestigation handler from AppRouter
  const outletContext = useOutletContext();
  const openNewInvestigation = outletContext?.openNewInvestigation;

  const [officer, setOfficerState] = useState(() => getOfficer() || { name: "Officer", station_name: "MP Cyber Cell" });
  const [stats, setStats] = useState({
    critical_cases: 0,
    active_cases: 0,
    awaiting_correlation: 0,
    closed_this_month: 0,
  });
  const [cases, setCases] = useState([]);
  const [unprocessedEvidence, setUnprocessedEvidence] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [meRes, statsRes, casesRes, evidenceRes, heatmapRes] = await Promise.allSettled([
        apiClient.get("auth/me"),
        apiClient.get("cases/summary-stats"),
        apiClient.get("cases"),
        apiClient.get("evidence/unprocessed"),
        apiClient.get("geo/heatmap"),
      ]);

      if (meRes.status === "fulfilled" && meRes.value) {
        setOfficerState(meRes.value);
        setOfficer(meRes.value);
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value);
      }

      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) {
        setCases(casesRes.value);
      }

      if (evidenceRes.status === "fulfilled" && Array.isArray(evidenceRes.value)) {
        setUnprocessedEvidence(evidenceRes.value);
      }

      if (heatmapRes.status === "fulfilled" && Array.isArray(heatmapRes.value)) {
        setHeatmap(heatmapRes.value);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for case creation events from modal
    const handleCaseCreated = () => fetchDashboardData();
    window.addEventListener("tracex_case_created", handleCaseCreated);
    return () => window.removeEventListener("tracex_case_created", handleCaseCreated);
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">
      {/* 1. Header — case-room log line, not a generic welcome card */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-textFaint font-medium mb-1">
            {todayStr}
          </div>
          <h1 className="text-[26px] font-display font-semibold text-text tracking-tight leading-none">
            {officer.station_name || "Bhopal Cyber Operations Room"}
          </h1>
          <p className="text-[13px] text-textDim mt-1.5">
            Logged in as <span className="font-medium text-text">{officer.name || "Investigator"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh operational telemetry"
            className="p-2 text-textDim hover:text-text hover:bg-bgSubtle border border-border rounded-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-accent" : ""}`} />
          </button>
          <button
            onClick={openNewInvestigation}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accentHover text-white rounded-sm text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New investigation</span>
          </button>
        </div>
      </section>

      {/* 2. Urgent Action Banner (renders only if freeze-relevant high-risk case exists) */}
      <UrgentBanner cases={cases} />

      {/* 3. Stat Row (Key incident load metrics) */}
      <section className="border-b border-border pb-4">
        <StatRow stats={stats} />
      </section>

      {/* 4. Top 5 High-Priority Cases Queue */}
      <section className="space-y-3">
        <PriorityTable
          cases={cases}
          isLoading={isLoading}
          selectedDistrict={selectedDistrict}
        />
      </section>

      {/* 5. Ingested Evidence Processing Tray */}
      <section className="space-y-3 pt-2">
        <div className="border-b border-border pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] uppercase font-semibold text-text tracking-wider">
              Evidence Ingestion & Indexing Pipeline
            </h2>
            <span className="text-[11px] font-mono text-textFaint bg-bgSubtle px-2 py-0.5 rounded border border-border">
              {unprocessedEvidence.length} in queue
            </span>
          </div>
          <span className="text-[11px] text-textFaint">
            Automatic hashing, parsing & multi-hop extraction
          </span>
        </div>
        <EvidenceTray files={unprocessedEvidence} isLoading={isLoading} />
      </section>

      {/* 6. Jurisdictional Fraud Density Heatmap */}
      <section className="space-y-3 pt-2">
        <div className="border-b border-border pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] uppercase font-semibold text-text tracking-wider">
              Jurisdictional Fraud Density Heatmap
            </h2>
          </div>
          <span className="text-[11px] text-textFaint">
            Click any district to filter priority incidents
          </span>
        </div>
        <HeatmapGrid
          heatmap={heatmap}
          isLoading={isLoading}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(dist) => setSelectedDistrict(dist)}
        />
      </section>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Network,
  FileText,
  RefreshCw,
  Clock,
  ShieldAlert,
} from "lucide-react";
import apiClient, { getOfficer, setOfficer } from "../api/client";
import UrgentBanner from "../components/UrgentBanner";
import StatRow from "../components/StatRow";
import PriorityTable from "../components/PriorityTable";
import EvidenceTray from "../components/EvidenceTray";
import HeatmapGrid from "../components/HeatmapGrid";
import NewInvestigationModal from "../components/NewInvestigationModal";

export default function Home() {
  const navigate = useNavigate();

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

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Parallel API queries to real backend endpoints
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
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstCaseId = cases[0]?.id || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Welcome Row */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text tracking-tight">
            Welcome back, Officer {officer.name || "Investigator"}
          </h1>
          <p className="text-[12.5px] text-textDim mt-0.5">
            {officer.station_name || "Bhopal Cyber Operations Room"} &nbsp;·&nbsp; {todayStr}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh feeds"
            className="p-2 text-textDim hover:text-text hover:bg-bgSubtle border border-border rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accentHover text-white rounded text-[13px] font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New investigation</span>
          </button>
        </div>
      </section>

      {/* 2. Urgent Banner (renders only if freeze-relevant high-risk case exists) */}
      <UrgentBanner cases={cases} />

      {/* 3. Stat Row (plain numbers with thin dividers) */}
      <section className="border-b border-border pb-3">
        <StatRow stats={stats} />
      </section>

      {/* 4. Priority Cases Table */}
      <section className="space-y-3">
        <div className="border-b border-border pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] uppercase font-semibold text-text tracking-wider">
              Priority Cases Queue
            </h2>
            <span className="text-[11px] font-mono text-textFaint bg-bgSubtle px-2 py-0.5 rounded border border-border">
              {cases.length} active
            </span>
          </div>
          <span className="text-[11.5px] text-textFaint">
            Ranked by multi-hop risk scoring engine
          </span>
        </div>
        <PriorityTable cases={cases} isLoading={isLoading} />
      </section>

      {/* 5. New / Unprocessed Evidence Tray */}
      <section className="space-y-3">
        <div className="border-b border-border pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] uppercase font-semibold text-text tracking-wider">
              Evidence Processing Tray
            </h2>
            <span className="text-[11px] font-mono text-textFaint bg-bgSubtle px-2 py-0.5 rounded border border-border">
              {unprocessedEvidence.length} queued
            </span>
          </div>
          <span className="text-[11.5px] text-textFaint">
            Automatic normalization & entity extraction
          </span>
        </div>
        <EvidenceTray files={unprocessedEvidence} isLoading={isLoading} />
      </section>

      {/* 6. Fraud Density Heatmap */}
      <section className="space-y-3">
        <div className="border-b border-border pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] uppercase font-semibold text-text tracking-wider">
              Jurisdictional Fraud Density Heatmap
            </h2>
          </div>
          <span className="text-[11.5px] text-textFaint">
            Resolved by IFSC & PIN code lookups
          </span>
        </div>
        <HeatmapGrid heatmap={heatmap} isLoading={isLoading} />
      </section>

      {/* 7. Quick Actions Row */}
      <section className="border-t border-border pt-4">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-textFaint mb-2.5">
          Quick Actions
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>New investigation</span>
          </button>

          <button
            onClick={() => {
              const query = prompt("Enter Case ID, Phone, UPI handle, or Account number:");
              if (query) {
                const match = cases.find(
                  (c) =>
                    c.case_number?.toLowerCase() === query.trim().toLowerCase() ||
                    c.victim_name?.toLowerCase().includes(query.trim().toLowerCase())
                );
                if (match) {
                  navigate(`/cases/${match.id}/graph`);
                } else {
                  alert(`No exact case found for "${query}". Check priority queue.`);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-textDim" />
            <span>Search case</span>
          </button>

          <button
            onClick={() => navigate(`/cases/${firstCaseId}/graph`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-textDim" />
            <span>View network graph</span>
          </button>

          <button
            onClick={() => navigate(`/cases/${firstCaseId}/reports`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-textDim" />
            <span>Generate brief</span>
          </button>
        </div>
      </section>

      {/* New Investigation Modal */}
      <NewInvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCaseCreated={() => fetchDashboardData()}
      />
    </div>
  );
}

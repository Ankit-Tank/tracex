import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import apiClient from "../api/client";
import NetworkGraph, { formatEntityType } from "../components/NetworkGraph";
import RiskTag from "../components/RiskTag";

const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

export default function ConnectionsGraph() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [recordsStats, setRecordsStats] = useState({
    telecom: 0,
    bank_upi: 0,
    other: 0,
    total: 0,
  });
  const [topRiskEntities, setTopRiskEntities] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [error, setError] = useState(null);

  const loadCaseAndGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [caseRes, graphRes, topRiskRes, summaryRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}`),
        apiClient.get(`cases/${caseId}/graph`),
        apiClient.get(`cases/${caseId}/entities/top-risk`),
        apiClient.get(`cases/${caseId}/summary`),
      ]);

      if (caseRes.status === "fulfilled") {
        setCaseData(caseRes.value);
      } else {
        throw new Error("Case could not be found or loaded");
      }

      if (graphRes.status === "fulfilled" && graphRes.value) {
        setGraphData({
          nodes: graphRes.value.nodes || [],
          edges: graphRes.value.edges || [],
        });
        if (graphRes.value.records_by_category) {
          setRecordsStats(graphRes.value.records_by_category);
        }
      }

      if (topRiskRes.status === "fulfilled" && Array.isArray(topRiskRes.value)) {
        setTopRiskEntities(topRiskRes.value);
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummaryData(summaryRes.value);
      }
    } catch (err) {
      setError(err.message || "Failed to load graph data for this case.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaseAndGraph();
  }, [caseId]);

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true);
    try {
      const regenerated = await apiClient.post(`cases/${caseId}/summary/regenerate`);
      setSummaryData(regenerated);
    } catch (err) {
      console.error("Failed to regenerate AI summary:", err);
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const formattedDate = caseData?.registered_at
    ? new Date(caseData.registered_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently registered";

  const scamLabel = caseData
    ? SCAM_TYPE_LABELS[caseData.scam_type] || caseData.scam_type
    : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Page Head */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text tracking-tight">
            Case <span className="font-mono font-bold text-accent">{caseData?.case_number || `#${caseId}`}</span> — connections & network graph
          </h1>
          <p className="text-[12.5px] text-textDim mt-0.5">
            Victim: <span className="font-medium text-text">{caseData?.victim_name || "Investigating"}</span>
            {" · "}
            <span>{scamLabel}</span>
            {" · "}
            <span>registered {formattedDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </button>
          <Link
            to={`/cases/${caseId}/reports`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-medium bg-accent hover:bg-accentHover text-white rounded transition-colors"
          >
            <span>View reports & brief</span>
          </Link>
        </div>
      </section>

      {/* Error Alert if any */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded text-riskHigh text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Connection Summary Row (plain numbers with thin dividers) */}
      <section className="border-b border-border pb-3">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border py-1">
          <div className="py-2.5 md:pr-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Telecom Records
            </div>
            <div className="text-xl font-bold font-mono text-text mt-0.5">
              {recordsStats.telecom || 0}
            </div>
          </div>
          <div className="py-2.5 md:px-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Bank-UPI Records
            </div>
            <div className="text-xl font-bold font-mono text-text mt-0.5">
              {recordsStats.bank_upi || 0}
            </div>
          </div>
          <div className="py-2.5 md:px-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Other Records
            </div>
            <div className="text-xl font-bold font-mono text-text mt-0.5">
              {recordsStats.other || 0}
            </div>
          </div>
          <div className="py-2.5 md:pl-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Total Records Correlated
            </div>
            <div className="text-xl font-bold font-mono text-accent mt-0.5">
              {recordsStats.total || 0}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Two-Column Layout: Network Graph (flex, wider) + 270px Side Column */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Graph Panel */}
        <div className="flex-1 min-w-0 w-full space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-[12px] uppercase tracking-wider font-semibold text-text">
                Multi-Hop Correlation Graph
              </span>
              <span className="text-[11px] font-mono text-textFaint bg-bgSubtle px-2 py-0.2 rounded border border-border">
                {graphData.nodes.length} nodes · {graphData.edges.length} links
              </span>
            </div>
            <span className="text-[11px] text-textFaint">
              Hover nodes/edges for court-admissible confidence metrics
            </span>
          </div>

          <NetworkGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            caseNumber={caseData?.case_number || caseId}
            isLoading={isLoading}
          />
        </div>

        {/* 270px Side Column */}
        <div className="w-full lg:w-[270px] lg:min-w-[270px] space-y-6">
          {/* Top Risk Entities Panel */}
          <div className="border border-border rounded p-3.5 space-y-3 bg-bg">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <h2 className="text-[12px] uppercase tracking-wider font-semibold text-text">
                  Top Risk Entities
                </h2>
              </div>
              <span className="text-[10.5px] font-mono text-textFaint">
                {topRiskEntities.length} flagged
              </span>
            </div>

            {topRiskEntities.length === 0 ? (
              <p className="text-[12px] text-textDim py-3 text-center">
                No high risk entities flagged yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topRiskEntities.map((ent) => (
                  <div
                    key={ent.id}
                    className="p-2 bg-bgSubtle rounded border border-border text-[12px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-semibold text-textFaint tracking-wider">
                        {formatEntityType(ent.entity_type)}
                      </span>
                      <RiskTag level={ent.risk_level} />
                    </div>
                    <div className="font-mono text-[11.5px] font-bold text-text break-all">
                      {ent.value}
                    </div>
                    {ent.anomaly_reason && (
                      <p className="text-[10.5px] text-riskHigh bg-riskHighBg/80 p-1 rounded font-medium">
                        {ent.anomaly_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Case Summary Panel */}
          <div className="border border-border rounded p-3.5 space-y-3 bg-bg">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <h2 className="text-[12px] uppercase tracking-wider font-semibold text-text">
                  AI Case Narrative
                </h2>
              </div>
              <button
                onClick={handleRegenerateSummary}
                disabled={isRegeneratingSummary}
                className="text-[11px] font-medium text-accent hover:text-accentHover hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRegeneratingSummary ? "animate-spin" : ""}`}
                />
                <span>Regenerate</span>
              </button>
            </div>

            {summaryData ? (
              <div className="space-y-2 text-[12px] text-textDim leading-relaxed">
                {summaryData.narrative_text
                  .split("\n\n")
                  .filter((p) => p.trim())
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-textFaint">
                  <span>Model: {summaryData.model_version || "Deterministic Narrative"}</span>
                  <span className="font-mono">
                    {summaryData.generated_at
                      ? new Date(summaryData.generated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-textDim py-4 text-center space-y-1">
                <p className="font-medium text-text">No correlation narrative generated yet.</p>
                <p className="text-[11px] text-textFaint">
                  Upload multi-source evidence and run correlation to synthesize an AI brief.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

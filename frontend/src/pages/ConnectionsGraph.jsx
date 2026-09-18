import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Shield,
  AlertCircle,
  FileText,
  ChevronDown,
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

  const [allCases, setAllCases] = useState([]);
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
  const [loadingStage, setLoadingStage] = useState("Building your relationship map…");
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [error, setError] = useState(null);

  const loadCaseAndGraph = async () => {
    setIsLoading(true);
    setIsStoryLoading(true);
    setLoadingStage("Building your relationship map…");
    setGraphData({ nodes: [], edges: [] });
    setTopRiskEntities([]);
    setSummaryData(null);
    setRecordsStats({ telecom: 0, bank_upi: 0, other: 0, total: 0 });
    setError(null);

    // These requests intentionally resolve independently. The frame appears at once,
    // then facts, relationships, targets, and the narrative fill in as they arrive.
    apiClient.get(`cases/${caseId}`).then(setCaseData).catch(() => {
      setError("Case could not be found or loaded");
    });
    apiClient.get("cases").then((data) => Array.isArray(data) && setAllCases(data)).catch(() => {});
    apiClient.get(`cases/${caseId}/entities/top-risk`)
      .then((data) => Array.isArray(data) && setTopRiskEntities(data))
      .catch(() => {});
    apiClient.get(`cases/${caseId}/graph`)
      .then((data) => {
        setGraphData({ nodes: data?.nodes || [], edges: data?.edges || [] });
        if (data?.records_by_category) setRecordsStats(data.records_by_category);
      })
      .catch(() => setError("The relationship map could not be loaded."))
      .finally(() => setIsLoading(false));
    apiClient.get(`cases/${caseId}/summary`)
      .then((data) => data && setSummaryData(data))
      .catch(() => {})
      .finally(() => setIsStoryLoading(false));
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
      {/* 1. Page Head with Quick Case Switcher */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text tracking-tight">
              Case <span className="font-mono font-bold text-accent">{caseData?.case_number || `#${caseId}`}</span> — Multi-Hop Correlation Graph
            </h1>

            {/* Case Switcher Dropdown */}
            {allCases.length > 1 && (
              <select
                value={caseId}
                onChange={(e) => navigate(`/cases/${e.target.value}/graph`)}
                className="text-[12px] font-mono bg-bgSubtle border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    Switch: {c.case_number} ({c.victim_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-[12.5px] text-textDim mt-1">
            Victim: <span className="font-semibold text-text">{caseData?.victim_name || "Investigating"}</span>
            {" · "}
            <span>{scamLabel}</span>
            {" · "}
            <span>registered {formattedDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded-sm transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations queue</span>
          </button>
          <Link
            to={`/cases/${caseId}/reports`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-medium bg-accent hover:bg-accentHover text-white rounded-sm transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate reports</span>
          </Link>
        </div>
      </section>

      {/* Error Alert if any */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded-sm text-riskHigh text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Connection Summary Row (plain numbers with thin dividers) */}
      <section className="border-b border-border pb-3">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border py-1">
          <div className="py-2 md:pr-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Telecom Artifacts
            </div>
            <div className="text-xl font-bold font-mono text-text mt-0.5">
              {recordsStats.telecom || 0}
            </div>
          </div>
          <div className="py-2 md:px-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Bank-UPI Transactions
            </div>
            <div className="text-xl font-bold font-mono text-text mt-0.5">
              {recordsStats.bank_upi || 0}
            </div>
          </div>
          <div className="py-2 md:px-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Other Artifacts
            </div>
            <div className="text-xl font-bold font-mono text-text mt-0.5">
              {recordsStats.other || 0}
            </div>
          </div>
          <div className="py-2 md:pl-6">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-textDim">
              Total Correlated Records
            </div>
            <div className="text-xl font-bold font-mono text-accent mt-0.5">
              {recordsStats.total || 0}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Two-Column Layout: Network Graph (flex, wider) + 290px Side Column */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Graph Panel */}
        <div className="flex-1 min-w-0 w-full space-y-2">
          <NetworkGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            caseNumber={caseData?.case_number || caseId}
            victimName={caseData?.victim_name}
            isLoading={isLoading}
            loadingLabel={loadingStage}
          />
        </div>

        {/* Side Column (290px) */}
        <div className="w-full lg:w-[290px] lg:min-w-[290px] space-y-5">
          {/* Top Risk Entities Panel */}
          <div className="border border-border rounded-sm p-4 space-y-3 bg-bg shadow-sm">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-accent" />
                <h3 className="text-[12.5px] uppercase tracking-wider font-bold text-text">
                  Priority Risk Targets
                </h3>
              </div>
              <span className="text-[11px] font-mono text-textFaint">
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
                    className="p-2.5 bg-bgSubtle rounded-sm border border-border text-[12px] space-y-1 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-textFaint tracking-wider">
                        {formatEntityType(ent.entity_type)}
                      </span>
                      <RiskTag level={ent.risk_level} />
                    </div>
                    <div className="font-mono text-[12px] font-bold text-text break-all">
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

        </div>
      </div>

      <CaseNarrative
        summaryData={summaryData}
        isLoading={isStoryLoading}
        isRegenerating={isRegeneratingSummary}
        onRegenerate={handleRegenerateSummary}
        nodes={graphData.nodes}
        edges={graphData.edges}
        targets={topRiskEntities}
      />
    </div>
  );
}

function CaseNarrative({ summaryData, isLoading, isRegenerating, onRegenerate, nodes, edges, targets }) {
  const sourceText = summaryData?.narrative_text?.trim();
  const riskTarget = targets[0]?.value || "the highest-priority identifier";
  const hasGraph = nodes.length > 0;
  const cards = [
    ["What is happening?", hasGraph ? `${nodes.length} identifiers are part of this case map, with ${edges.length} observed relationships between them.` : "We are preparing the identifiers and evidence for this case."],
    ["How are they connected?", hasGraph ? `The lines show where the same account, device, phone, or online trace appears together. Follow the strongest lines first.` : "Connections will appear here as soon as the relationship map is ready."],
    ["What stands out?", targets.length ? `${riskTarget} is the first item to review because it has been flagged as a priority risk target.` : "We are checking for identifiers that deserve immediate attention."],
    ["Key takeaway", hasGraph ? `Start with ${riskTarget}, then use the connected lines to decide which supporting records to verify next.` : "The story will update when enough evidence has been connected."],
  ];
  return (
    <section className="relative overflow-hidden border border-border rounded-sm bg-bg shadow-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-accentSoft border border-accentBorder flex items-center justify-center"><Sparkles className="w-4 h-4 text-accent" /></span><div><h2 className="font-display text-lg font-semibold text-text">AI Case Narrative</h2><p className="text-[12px] text-textDim">A simple reading of what the relationship map means.</p></div></div>
        <button onClick={onRegenerate} disabled={isRegenerating} className="self-start sm:self-auto text-[12px] font-semibold text-accent hover:text-accentHover disabled:opacity-50 flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />Refresh story</button>
      </div>
      {isLoading ? <div className="grid md:grid-cols-2 gap-px bg-border"><NarrativeSkeleton label="Creating your story…" /><NarrativeSkeleton /><NarrativeSkeleton /><NarrativeSkeleton /></div> : <><div className="grid md:grid-cols-2 gap-px bg-border">{cards.map(([title, body], index) => <div key={title} className={`bg-bg p-5 min-h-[132px] ${index === 3 ? "md:col-span-2" : ""}`}><span className="text-[10px] font-bold tracking-[0.16em] uppercase text-accent">0{index + 1}</span><h3 className="mt-2 text-[14px] font-semibold text-text">{title}</h3><p className="mt-1.5 text-[12.5px] leading-relaxed text-textDim max-w-3xl">{body}</p></div>)}</div>{sourceText && <details className="px-5 py-3 border-t border-border text-[12px] text-textDim"><summary className="cursor-pointer text-textFaint hover:text-text">View detailed analyst note</summary><p className="mt-3 leading-relaxed whitespace-pre-line">{sourceText}</p></details>}</>}
    </section>
  );
}

function NarrativeSkeleton({ label }) { return <div className="bg-bg p-5 min-h-[132px] animate-pulse"><span className="text-[12px] text-textDim">{label}</span><div className="mt-4 h-3 w-2/5 rounded bg-bgMuted" /><div className="mt-3 h-2.5 w-full rounded bg-bgMuted" /><div className="mt-2 h-2.5 w-4/5 rounded bg-bgMuted" /></div>; }

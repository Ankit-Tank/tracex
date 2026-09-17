import React, { useState, useMemo, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Shield,
  Layers,
  Info,
  ExternalLink,
  Landmark,
  Smartphone,
  Phone,
  Globe,
  FileCode2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  X,
  ArrowRight,
  Filter,
  Sparkles,
} from "lucide-react";

export function formatBasis(basis) {
  if (!basis) return "Entity Link";
  const map = {
    shared_upi_handle: "Shared UPI Handle",
    shared_account: "Shared Account Number",
    shared_imei: "Shared Physical Device (IMEI)",
    shared_imsi: "Shared SIM Card (IMSI)",
    shared_ip: "Shared Exact IP Address",
    shared_subnet: "Shared IP /24 Subnet",
    shared_phone: "Shared Phone Number",
    spoofed_caller_pattern: "Spoofed Caller Pattern",
    known_c2_server: "Known Malware C2 Beacon",
    high_risk_permissions: "High Risk Android Permission",
  };
  return map[basis] || basis.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatEntityType(type) {
  if (!type) return "Entity";
  const map = {
    upi_handle: "UPI Handle",
    account: "Bank Account",
    phone: "Phone Number",
    imei: "Device IMEI",
    imsi: "SIM (IMSI)",
    ip_address: "IP Address",
    apk_hash: "Malware APK",
    url: "Phishing URL",
  };
  return map[type] || type.replace(/_/g, " ").toUpperCase();
}

export function getEntityIcon(type) {
  const norm = (type || "").toLowerCase();
  if (norm === "account") return Landmark;
  if (norm === "upi_handle") return Landmark;
  if (norm === "imei") return Smartphone;
  if (norm === "imsi" || norm === "phone") return Phone;
  if (norm === "ip_address" || norm === "url") return Globe;
  if (norm === "apk_hash") return FileCode2;
  return Shield;
}

export default function NetworkGraph({
  nodes = [],
  edges = [],
  caseNumber = "",
  victimName = "",
  isLoading = false,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all"); // 'all', 'high', 'freeze', 'cross_case'
  const [moneyTrailOnly, setMoneyTrailOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inspector Drawer State
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  const containerRef = useRef(null);

  // Copy helper
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 1500);
  };

  // Categorize nodes into 4 clear functional tiers:
  // Tier 1: Financial Beneficiaries & Mules (Accounts, UPI)
  // Tier 2: Communications (Phones, IMSI)
  // Tier 3: Devices & Hardware (IMEI)
  // Tier 4: Digital Network & Malware (IPs, URLs, APK)
  const categorizedNodes = useMemo(() => {
    const tiers = {
      financial: [],
      communication: [],
      device: [],
      network: [],
    };

    nodes.forEach((node) => {
      const t = (node.entity_type || "").toLowerCase();
      if (t === "account" || t === "upi_handle") {
        tiers.financial.push(node);
      } else if (t === "phone" || t === "imsi") {
        tiers.communication.push(node);
      } else if (t === "imei") {
        tiers.device.push(node);
      } else {
        tiers.network.push(node);
      }
    });

    return tiers;
  }, [nodes]);

  // Compute clean structured grid positions
  const nodePositions = useMemo(() => {
    const positions = {};
    const width = 880;
    const height = 540;

    // Define 4 clear vertical columns for the pipeline
    const columns = [
      { id: "financial", x: 160, nodes: categorizedNodes.financial },
      { id: "communication", x: 390, nodes: categorizedNodes.communication },
      { id: "device", x: 610, nodes: categorizedNodes.device },
      { id: "network", x: 800, nodes: categorizedNodes.network },
    ];

    columns.forEach((col) => {
      const count = col.nodes.length;
      if (count === 0) return;

      const spacing = Math.min(85, (height - 120) / Math.max(1, count));
      const startY = (height - (count - 1) * spacing) / 2;

      col.nodes.forEach((node, idx) => {
        positions[node.id] = {
          x: col.x,
          y: startY + idx * spacing,
        };
      });
    });

    return positions;
  }, [categorizedNodes]);

  // Filter logic
  const isNodeVisible = (node) => {
    // Money Trail Mode
    if (moneyTrailOnly) {
      const isFin = node.entity_type === "account" || node.entity_type === "upi_handle";
      return isFin;
    }

    // Type filter
    if (activeFilter !== "all" && node.entity_type !== activeFilter) {
      return false;
    }

    // Risk / attribute filter
    if (riskFilter === "high" && node.risk_level !== "high") return false;
    if (riskFilter === "cross_case" && !node.is_cross_case) return false;
    if (riskFilter === "freeze") {
      const isFreezeTgt =
        node.risk_level === "high" &&
        (node.entity_type === "account" || node.entity_type === "upi_handle");
      if (!isFreezeTgt) return false;
    }

    return true;
  };

  const isEdgeVisible = (edge) => {
    const sNode = nodes.find((n) => n.id === edge.source);
    const tNode = nodes.find((n) => n.id === edge.target);
    if (!sNode || !tNode) return false;

    if (moneyTrailOnly) {
      const isFinS = sNode.entity_type === "account" || sNode.entity_type === "upi_handle";
      const isFinT = tNode.entity_type === "account" || tNode.entity_type === "upi_handle";
      return isFinS && isFinT;
    }

    return isNodeVisible(sNode) || isNodeVisible(tNode);
  };

  // Filter chips counts
  const entityCounts = useMemo(() => {
    const counts = { all: nodes.length };
    nodes.forEach((n) => {
      counts[n.entity_type] = (counts[n.entity_type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  if (isLoading) {
    return (
      <div className="h-[560px] bg-bg border border-border rounded-lg flex items-center justify-center text-textDim text-[13px]">
        Reconstructing multi-hop correlation graph...
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="h-[560px] bg-bg border border-border rounded-lg flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 rounded-full bg-bgSubtle border border-border flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-textFaint" />
        </div>
        <h3 className="text-[15px] font-bold text-text">No Entity Connections Generated</h3>
        <p className="text-[12.5px] text-textDim max-w-md mt-1.5 leading-normal">
          This case has no correlated artifacts yet. Upload evidence files (CDR, bank statements, or APK dumps) and trigger correlation to render the multi-hop network.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-bg border border-border rounded-lg flex flex-col select-none transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
          : "h-[580px] w-full"
      }`}
    >
      {/* 1. Enhanced Filter Toolbar */}
      <div className="p-3 border-b border-border bg-bg flex flex-wrap items-center justify-between gap-3">
        {/* Entity Type Filter Chips with Counters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              setActiveFilter("all");
              setMoneyTrailOnly(false);
            }}
            className={`px-3 py-1 text-[11.5px] rounded-md font-medium transition-all cursor-pointer ${
              activeFilter === "all" && !moneyTrailOnly
                ? "bg-accent text-white font-semibold"
                : "bg-bgSubtle text-textDim border border-border hover:text-text"
            }`}
          >
            All Entities ({nodes.length})
          </button>

          {Object.entries(entityCounts)
            .filter(([k]) => k !== "all")
            .map(([type, count]) => (
              <button
                key={type}
                onClick={() => {
                  setActiveFilter(type);
                  setMoneyTrailOnly(false);
                }}
                className={`px-2.5 py-1 text-[11.5px] rounded-md font-medium transition-all cursor-pointer ${
                  activeFilter === type && !moneyTrailOnly
                    ? "bg-accentSoft text-accent border border-accent font-semibold"
                    : "bg-bgSubtle text-textDim border border-border hover:text-text"
                }`}
              >
                {formatEntityType(type)} ({count})
              </button>
            ))}
        </div>

        {/* Action Toggles: Money Trail & Zoom */}
        <div className="flex items-center gap-2">
          {/* Highlight Money Trail Toggle */}
          <button
            onClick={() => {
              setMoneyTrailOnly(!moneyTrailOnly);
              setActiveFilter("all");
            }}
            className={`px-3 py-1 rounded-md text-[11.5px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              moneyTrailOnly
                ? "bg-urgentBg text-urgentText border border-urgentBorder ring-2 ring-urgentBorder/40"
                : "bg-bg border border-border text-textDim hover:text-text hover:bg-bgSubtle"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-urgentText" />
            <span>Highlight Money Trail</span>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 pl-2 border-l border-border">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
              title="Zoom In"
              className="p-1.5 rounded hover:bg-bgSubtle text-textDim hover:text-text"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
              title="Zoom Out"
              className="p-1.5 rounded hover:bg-bgSubtle text-textDim hover:text-text"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              title="Reset Zoom"
              className="p-1.5 rounded hover:bg-bgSubtle text-textDim hover:text-text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-1.5 rounded hover:bg-bgSubtle text-textDim hover:text-text"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Swimlane Titles */}
      <div className="h-8 px-6 bg-bgSubtle/60 border-b border-border grid grid-cols-4 text-[10.5px] font-bold uppercase tracking-wider text-textFaint select-none">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-riskHigh" />
          <span>1. Financial Mule Accounts</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4">
          <Phone className="w-3.5 h-3.5 text-accent" />
          <span>2. Telecom & SIM Nodes</span>
        </div>
        <div className="flex items-center gap-1.5 pl-6">
          <Smartphone className="w-3.5 h-3.5 text-textDim" />
          <span>3. Physical Devices (IMEI)</span>
        </div>
        <div className="flex items-center gap-1.5 pl-8">
          <Globe className="w-3.5 h-3.5 text-textDim" />
          <span>4. IP / Malware Artifacts</span>
        </div>
      </div>

      {/* 3. Main SVG Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <svg
          viewBox="0 0 960 540"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <g
            transform={`scale(${zoom})`}
            style={{ transformOrigin: "center center", transition: "transform 0.15s ease-out" }}
          >
            {/* Background Column Guide Lines */}
            <line x1="260" y1="20" x2="260" y2="520" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="490" y1="20" x2="490" y2="520" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="700" y1="20" x2="700" y2="520" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="4,4" />

            {/* Edge Connections */}
            {edges.map((edge) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const visible = isEdgeVisible(edge);
              const conf = edge.confidence || 0;
              const isCrossCase = edge.extra && edge.extra.cross_case;

              // Stroke styling
              const strokeColor = isCrossCase
                ? "var(--risk-high)"
                : conf > 0.75
                ? "var(--accent)"
                : "var(--border-strong)";

              const strokeWidth = conf > 0.75 ? 2.5 : 1.5;
              const strokeDasharray = conf <= 0.65 ? "4,4" : "none";

              return (
                <g key={edge.id || `${edge.source}-${edge.target}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    opacity={visible ? 0.8 : 0.1}
                    className="transition-all duration-150 cursor-pointer hover:stroke-accent"
                    onClick={() => {
                      const s = nodes.find((n) => n.id === edge.source);
                      const t = nodes.find((n) => n.id === edge.target);
                      setSelectedEdge({ ...edge, sourceNode: s, targetNode: t });
                    }}
                  />

                  {/* Edge Connection Badge at Midpoint */}
                  {visible && conf > 0.6 && (
                    <g
                      transform={`translate(${(p1.x + p2.x) / 2}, ${(p1.y + p2.y) / 2})`}
                      className="cursor-pointer select-none"
                      onClick={() => {
                        const s = nodes.find((n) => n.id === edge.source);
                        const t = nodes.find((n) => n.id === edge.target);
                        setSelectedEdge({ ...edge, sourceNode: s, targetNode: t });
                      }}
                    >
                      <rect
                        x="-36"
                        y="-8"
                        width="72"
                        height="16"
                        rx="8"
                        fill="#FFFFFF"
                        stroke={isCrossCase ? "var(--risk-high)" : "var(--border)"}
                        strokeWidth="1"
                      />
                      <text
                        textAnchor="middle"
                        y="3.5"
                        className="text-[8.5px] font-mono font-bold fill-text"
                      >
                        {Math.round(conf * 100)}% conf
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Structured Node Cards */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const visible = isNodeVisible(node);
              const isSelected = selectedNode?.id === node.id;
              const Icon = getEntityIcon(node.entity_type);
              const isHighRisk = node.risk_level === "high";
              const isCross = !!node.is_cross_case;

              // Node Box dimensions
              const boxW = 160;
              const boxH = 48;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x - boxW / 2}, ${pos.y - boxH / 2})`}
                  opacity={visible ? 1 : 0.15}
                  className="cursor-pointer select-none transition-all duration-150"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Card Shell */}
                  <rect
                    width={boxW}
                    height={boxH}
                    rx="6"
                    fill="#FFFFFF"
                    stroke={
                      isSelected
                        ? "var(--accent)"
                        : isHighRisk
                        ? "var(--risk-high)"
                        : "var(--border)"
                    }
                    strokeWidth={isSelected ? 2 : isHighRisk ? 1.75 : 1}
                    className="filter drop-shadow-sm hover:stroke-accent"
                  />

                  {/* Icon Area */}
                  <rect
                    x="1"
                    y="1"
                    width="34"
                    height={boxH - 2}
                    rx="5"
                    fill={isHighRisk ? "var(--risk-high-bg)" : "var(--bg-subtle)"}
                  />
                  <g transform="translate(10, 16)">
                    <Icon
                      className={`w-4 h-4 ${
                        isHighRisk ? "text-riskHigh" : "text-accent"
                      }`}
                    />
                  </g>

                  {/* Content: Type & Label */}
                  <text
                    x="42"
                    y="18"
                    className="text-[9px] font-bold uppercase tracking-wider fill-textFaint"
                  >
                    {formatEntityType(node.entity_type)}
                  </text>
                  <text
                    x="42"
                    y="34"
                    className="text-[11px] font-mono font-bold fill-text"
                  >
                    {node.label.length > 14 ? `${node.label.substring(0, 13)}…` : node.label}
                  </text>

                  {/* Risk Dot / Flag Badge */}
                  {isHighRisk && (
                    <circle cx={boxW - 10} cy="12" r="3.5" fill="var(--risk-high)" />
                  )}

                  {/* Cross-case indicator */}
                  {isCross && (
                    <g transform={`translate(${boxW - 22}, ${boxH - 18})`}>
                      <rect width="16" height="12" rx="3" fill="var(--risk-high)" />
                      <text x="8" y="9" textAnchor="middle" className="text-[7px] font-mono fill-white font-bold">
                        CC
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend Footnote Bottom-Left */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-[11px] text-textDim flex items-center gap-3 shadow-sm">
          <span className="font-semibold text-text">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-riskHigh" />
            <span>High Risk / Freeze Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-accent" />
            <span>High Conf &gt; 75%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b border-dashed border-textDim" />
            <span>Corroborating &le; 65%</span>
          </span>
        </div>

        {/* 4. Slide-Over Entity Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-bg border-l border-border shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-40 animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-textFaint">
                    Selected Entity Dossier
                  </span>
                  <h4 className="text-[14px] font-bold text-text mt-0.5">
                    {formatEntityType(selectedNode.entity_type)}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-bgSubtle text-textDim"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Entity Value Box with Copy */}
              <div className="p-2.5 bg-bgSubtle border border-border rounded-md space-y-1">
                <span className="text-[10.5px] uppercase font-semibold text-textFaint">
                  Identifier Value
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[12px] text-text break-all">
                    {selectedNode.label}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.label)}
                    className="p-1 rounded hover:bg-bg border border-border text-textDim hover:text-text flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-riskLow" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Risk & Anomaly Assessment */}
              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-textDim">Risk Classification:</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      selectedNode.risk_level === "high"
                        ? "bg-riskHighBg text-riskHigh"
                        : "bg-riskLowBg text-riskLow"
                    }`}
                  >
                    {selectedNode.risk_level || "Standard"} Risk
                  </span>
                </div>
                {selectedNode.anomaly_reason && (
                  <div className="p-2 bg-riskHighBg/60 border border-riskHigh/20 rounded text-[11px] text-riskHigh font-medium">
                    {selectedNode.anomaly_reason}
                  </div>
                )}
              </div>

              {/* Court Legal Directive */}
              <div className="p-2.5 bg-accentSoft/60 border border-accentBorder rounded-md text-[11.5px] text-accent space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Recommended Action (CrPC)</span>
                </div>
                <p className="leading-snug text-text">
                  {selectedNode.entity_type === "account" || selectedNode.entity_type === "upi_handle"
                    ? "Issue Section 91 CrPC freeze directive to nodal bank for immediate debit stoppage."
                    : selectedNode.entity_type === "imei" || selectedNode.entity_type === "phone"
                    ? "Requisition subscriber CAF, location logs, and handset IMEI history from telecom licensees."
                    : "Preserve server connection logs and coordinate CERT-In emergency takedown."}
                </p>
              </div>

              {/* Connected Links Summary */}
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-textFaint">
                  Correlated Multi-Hop Links
                </span>
                <div className="mt-1.5 space-y-1 text-[11.5px]">
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => {
                      const otherId = e.source === selectedNode.id ? e.target : e.source;
                      const otherNode = nodes.find((n) => n.id === otherId);
                      return (
                        <div
                          key={e.id}
                          className="p-1.5 bg-bgSubtle rounded border border-border flex items-center justify-between"
                        >
                          <span className="font-mono font-medium text-text truncate max-w-[140px]">
                            {otherNode?.label || `#${otherId}`}
                          </span>
                          <span className="text-[10px] font-mono text-accent font-bold">
                            {Math.round((e.confidence || 0) * 100)}% ({formatBasis(e.basis)})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-border text-[10.5px] text-textFaint flex items-center justify-between">
              <span>Origin: Case #{selectedNode.case_id || caseNumber}</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-accent hover:underline font-medium"
              >
                Close panel
              </button>
            </div>
          </div>
        )}

        {/* 5. Edge Inspector Modal/Banner */}
        {selectedEdge && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 bg-bg border border-border rounded-lg shadow-xl p-3 max-w-md w-full z-40 text-[12px] select-none animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
              <span className="font-bold text-text uppercase text-[10.5px]">
                Correlation Rationale: {formatBasis(selectedEdge.basis)}
              </span>
              <button onClick={() => setSelectedEdge(null)} className="text-textDim hover:text-text">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] bg-bgSubtle p-1.5 rounded">
              <span>{selectedEdge.sourceNode?.label}</span>
              <ArrowRight className="w-3 h-3 text-accent" />
              <span>{selectedEdge.targetNode?.label}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-textDim">Statistical Correlation Confidence:</span>
              <span className="font-mono font-bold text-accent">
                {Math.round((selectedEdge.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

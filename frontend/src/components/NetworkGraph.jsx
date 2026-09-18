import React, { useState, useMemo, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Shield,
  Layers,
  Landmark,
  Smartphone,
  Phone,
  Globe,
  FileCode2,
  Copy,
  Check,
  X,
  ArrowRight,
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

// Risk tier -> ring / badge color. Reserved exclusively for risk meaning.
function riskColors(level) {
  const norm = (level || "").toLowerCase();
  if (norm === "critical") return { ring: "var(--risk-critical)", badgeBg: "var(--risk-critical)", badgeFg: "#020617" };
  if (norm === "high") return { ring: "var(--risk-high)", badgeBg: "var(--risk-high)", badgeFg: "#020617" };
  if (norm === "medium" || norm === "med") return { ring: "var(--risk-med)", badgeBg: "var(--risk-med)", badgeFg: "#020617" };
  return { ring: "var(--line-strong)", badgeBg: "var(--panel-sunken)", badgeFg: "var(--ink-dim)" };
}

export default function NetworkGraph({
  nodes = [],
  edges = [],
  caseNumber = "",
  victimName = "",
  isLoading = false,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [moneyTrailOnly, setMoneyTrailOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  const containerRef = useRef(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 1500);
  };

  // Group nodes into 4 functional lanes so the layout stays deterministic
  // and legible instead of a physics simulation that can produce overlaps.
  const categorizedNodes = useMemo(() => {
    const tiers = { financial: [], communication: [], device: [], network: [] };
    nodes.forEach((node) => {
      const t = (node.entity_type || "").toLowerCase();
      if (t === "account" || t === "upi_handle") tiers.financial.push(node);
      else if (t === "phone" || t === "imsi") tiers.communication.push(node);
      else if (t === "imei") tiers.device.push(node);
      else tiers.network.push(node);
    });
    return tiers;
  }, [nodes]);

  const nodePositions = useMemo(() => {
    const positions = {};
    const height = 540;
    const columns = [
      { x: 130, nodes: categorizedNodes.financial },
      { x: 380, nodes: categorizedNodes.communication },
      { x: 630, nodes: categorizedNodes.device },
      { x: 850, nodes: categorizedNodes.network },
    ];

    columns.forEach((col) => {
      const count = col.nodes.length;
      if (count === 0) return;
      const spacing = Math.min(100, (height - 120) / Math.max(1, count));
      const startY = (height - (count - 1) * spacing) / 2;
      col.nodes.forEach((node, idx) => {
        positions[node.id] = { x: col.x, y: startY + idx * spacing };
      });
    });

    return positions;
  }, [categorizedNodes]);

  // Degree count per node — mirrors the relationship-count badge convention
  const degreeByNode = useMemo(() => {
    const counts = {};
    edges.forEach((e) => {
      counts[e.source] = (counts[e.source] || 0) + 1;
      counts[e.target] = (counts[e.target] || 0) + 1;
    });
    return counts;
  }, [edges]);

  const isNodeVisible = (node) => {
    if (moneyTrailOnly) {
      return node.entity_type === "account" || node.entity_type === "upi_handle";
    }
    if (activeFilter !== "all" && node.entity_type !== activeFilter) return false;
    if (riskFilter === "high" && node.risk_level !== "high") return false;
    if (riskFilter === "cross_case" && !node.is_cross_case) return false;
    if (riskFilter === "freeze") {
      const isFreezeTgt =
        node.risk_level === "high" && (node.entity_type === "account" || node.entity_type === "upi_handle");
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

  const entityCounts = useMemo(() => {
    const counts = { all: nodes.length };
    nodes.forEach((n) => {
      counts[n.entity_type] = (counts[n.entity_type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  if (isLoading) {
    return (
      <div className="h-[560px] bg-bg border border-border rounded-sm flex items-center justify-center text-textDim text-[13px]">
        Reconstructing multi-hop correlation graph...
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="h-[560px] bg-bg border border-border rounded-sm flex flex-col items-center justify-center text-center p-8">
        <div className="w-12 h-12 rounded-full bg-bgSubtle border border-border flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-textFaint" />
        </div>
        <h3 className="text-[15px] font-display font-semibold text-text">No entity connections generated</h3>
        <p className="text-[12.5px] text-textDim max-w-md mt-1.5 leading-normal">
          This case has no correlated artifacts yet. Upload evidence files (CDR, bank statements, or APK dumps) and trigger correlation to render the multi-hop network.
        </p>
      </div>
    );
  }

  const NODE_R = 22;

  return (
    <div
      ref={containerRef}
      className={`relative bg-bg border border-border rounded-sm flex flex-col select-none transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "h-[580px] w-full"
      }`}
    >
      {/* Filter toolbar */}
      <div className="p-3 border-b border-border bg-bg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              setActiveFilter("all");
              setMoneyTrailOnly(false);
            }}
            className={`px-3 py-1 text-[11.5px] rounded-sm font-medium transition-all cursor-pointer ${
              activeFilter === "all" && !moneyTrailOnly
                ? "bg-accent text-bg font-semibold"
                : "bg-bgSubtle text-textDim border border-border hover:text-text"
            }`}
          >
            All entities ({nodes.length})
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
                className={`px-2.5 py-1 text-[11.5px] rounded-sm font-medium transition-all cursor-pointer ${
                  activeFilter === type && !moneyTrailOnly
                    ? "bg-accentSoft text-accent border border-accent font-semibold"
                    : "bg-bgSubtle text-textDim border border-border hover:text-text"
                }`}
              >
                {formatEntityType(type)} ({count})
              </button>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMoneyTrailOnly(!moneyTrailOnly);
              setActiveFilter("all");
            }}
            className={`px-3 py-1 rounded-sm text-[11.5px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              moneyTrailOnly
                ? "bg-urgentBg text-urgentText border border-urgentBorder"
                : "bg-bg border border-border text-textDim hover:text-text hover:bg-bgSubtle"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Highlight money trail</span>
          </button>

          <div className="flex items-center gap-1 pl-2 border-l border-border">
            <button onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))} title="Zoom in" className="p-1.5 rounded-sm hover:bg-bgSubtle text-textDim hover:text-text">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))} title="Zoom out" className="p-1.5 rounded-sm hover:bg-bgSubtle text-textDim hover:text-text">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(1)} title="Reset zoom" className="p-1.5 rounded-sm hover:bg-bgSubtle text-textDim hover:text-text">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} className="p-1.5 rounded-sm hover:bg-bgSubtle text-textDim hover:text-text">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG canvas */}
      <div className="flex-1 relative overflow-hidden bg-bg">
        <svg viewBox="0 0 960 540" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--line-strong)" />
            </marker>
            <marker id="arrowCritical" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--risk-critical)" />
            </marker>
          </defs>

          <g transform={`scale(${zoom})`} style={{ transformOrigin: "center center", transition: "transform 0.15s ease-out" }}>
            {/* Column guide lines */}
            <line x1="255" y1="20" x2="255" y2="520" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
            <line x1="505" y1="20" x2="505" y2="520" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
            <line x1="740" y1="20" x2="740" y2="520" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />

            {/* Edges — gently curved, matching a case-board trace style */}
            {edges.map((edge) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const visible = isEdgeVisible(edge);
              const conf = edge.confidence || 0;
              const isCritical = edge.extra && edge.extra.cross_case;

              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2;
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              const curve = Math.min(28, dist * 0.12);
              const cx = mx - (dy / dist) * curve;
              const cy = my + (dx / dist) * curve;

              const strokeColor = isCritical ? "var(--risk-critical)" : "var(--line-strong)";
              const strokeWidth = isCritical ? 2.75 : conf > 0.75 ? 2 : 1.5;
              const strokeDasharray = !isCritical && conf <= 0.65 ? "4,4" : "none";

              return (
                <g key={edge.id || `${edge.source}-${edge.target}`}>
                  <path
                    d={`M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    opacity={visible ? (isCritical ? 1 : 0.75) : 0.08}
                    markerEnd={isCritical ? "url(#arrowCritical)" : "url(#arrow)"}
                    className="transition-all duration-150 cursor-pointer"
                    onClick={() => {
                      const s = nodes.find((n) => n.id === edge.source);
                      const t = nodes.find((n) => n.id === edge.target);
                      setSelectedEdge({ ...edge, sourceNode: s, targetNode: t });
                    }}
                  />

                  {visible && conf > 0.6 && (
                    <g
                      transform={`translate(${cx}, ${cy})`}
                      className="cursor-pointer select-none"
                      onClick={() => {
                        const s = nodes.find((n) => n.id === edge.source);
                        const t = nodes.find((n) => n.id === edge.target);
                        setSelectedEdge({ ...edge, sourceNode: s, targetNode: t });
                      }}
                    >
                      <rect x="-34" y="-8" width="68" height="16" rx="8" fill="var(--panel)" stroke={isCritical ? "var(--risk-critical)" : "var(--border)"} strokeWidth="1" />
                      <text textAnchor="middle" y="3.5" className="text-[8.5px] font-mono font-bold fill-text">
                        {Math.round(conf * 100)}% conf
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Circular icon-badge nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const visible = isNodeVisible(node);
              const isSelected = selectedNode?.id === node.id;
              const Icon = getEntityIcon(node.entity_type);
              const isCross = !!node.is_cross_case;
              const degree = degreeByNode[node.id] || 0;
              const rc = riskColors(node.risk_level);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={visible ? 1 : 0.15}
                  className="cursor-pointer select-none transition-all duration-150"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Body */}
                  <circle
                    r={NODE_R}
                    fill="var(--panel-sunken)"
                    stroke={isSelected ? "var(--signal-hover)" : rc.ring}
                    strokeWidth={isSelected ? 3 : node.risk_level ? 2.5 : 1.5}
                  />
                  <circle r={NODE_R - 3.5} fill="var(--panel)" />

                  {/* Icon */}
                  <g transform={`translate(${-9}, ${-9})`}>
                    <Icon className="w-[18px] h-[18px]" style={{ color: "var(--signal-hover)" }} />
                  </g>

                  {/* Degree / relationship-count badge, top-right */}
                  {degree > 0 && (
                    <g transform={`translate(${NODE_R - 6}, ${-NODE_R + 6})`}>
                      <circle r="10" fill={rc.badgeBg} stroke="var(--panel)" strokeWidth="2" />
                      <text textAnchor="middle" y="3.5" className="text-[9px] font-mono font-bold" fill={rc.badgeFg}>
                        {degree}
                      </text>
                    </g>
                  )}

                  {/* Cross-case indicator */}
                  {isCross && (
                    <g transform={`translate(${-10}, ${NODE_R + 2})`}>
                      <rect width="20" height="12" rx="3" fill="var(--risk-critical)" />
                      <text x="10" y="9" textAnchor="middle" className="text-[7px] font-mono fill-bg font-bold">
                        CC
                      </text>
                    </g>
                  )}

                  {/* Label */}
                  <text x="0" y={NODE_R + 18} textAnchor="middle" className="text-[9px] font-bold uppercase tracking-wider fill-textFaint">
                    {formatEntityType(node.entity_type)}
                  </text>
                  <text x="0" y={NODE_R + 31} textAnchor="middle" className="text-[10.5px] font-mono font-bold fill-text">
                    {node.label && node.label.length > 16 ? `${node.label.substring(0, 15)}…` : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-bgSubtle/95 backdrop-blur-sm border border-border rounded-sm px-3 py-2 text-[11px] text-textDim flex items-center gap-3">
          <span className="font-semibold text-text">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-riskCritical" />
            <span>Critical / cross-case link</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-textFaint" />
            <span>High conf &gt; 75%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-b border-dashed border-textFaint" />
            <span>Corroborating &le; 65%</span>
          </span>
        </div>

        {/* Entity inspector drawer */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-bg border-l border-border shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-40 animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-textFaint">Selected entity dossier</span>
                  <h4 className="text-[14px] font-display font-semibold text-text mt-0.5">{formatEntityType(selectedNode.entity_type)}</h4>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1 rounded-sm hover:bg-bgSubtle text-textDim">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 bg-bgSubtle border border-border rounded-sm space-y-1">
                <span className="text-[10.5px] uppercase font-semibold text-textFaint">Identifier value</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[12px] text-text break-all">{selectedNode.label}</span>
                  <button
                    onClick={() => handleCopy(selectedNode.label)}
                    className="p-1 rounded-sm hover:bg-bg border border-border text-textDim hover:text-text flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-riskLow" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-textDim">Risk classification:</span>
                  <span
                    className={`px-2 py-0.5 rounded-sm font-bold uppercase text-[10px] ${
                      selectedNode.risk_level === "high" ? "bg-riskHighBg text-riskHigh" : "bg-riskLowBg text-riskLow"
                    }`}
                  >
                    {selectedNode.risk_level || "Standard"} risk
                  </span>
                </div>
                {selectedNode.anomaly_reason && (
                  <div className="p-2 bg-riskHighBg border border-riskHigh/30 rounded-sm text-[11px] text-riskHigh font-medium">
                    {selectedNode.anomaly_reason}
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-accentSoft border border-accentBorder rounded-sm text-[11.5px] text-accent space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Recommended action (CrPC)</span>
                </div>
                <p className="leading-snug text-text">
                  {selectedNode.entity_type === "account" || selectedNode.entity_type === "upi_handle"
                    ? "Issue Section 91 CrPC freeze directive to nodal bank for immediate debit stoppage."
                    : selectedNode.entity_type === "imei" || selectedNode.entity_type === "phone"
                    ? "Requisition subscriber CAF, location logs, and handset IMEI history from telecom licensees."
                    : "Preserve server connection logs and coordinate CERT-In emergency takedown."}
                </p>
              </div>

              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-textFaint">Correlated multi-hop links</span>
                <div className="mt-1.5 space-y-1 text-[11.5px]">
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => {
                      const otherId = e.source === selectedNode.id ? e.target : e.source;
                      const otherNode = nodes.find((n) => n.id === otherId);
                      return (
                        <div key={e.id} className="p-1.5 bg-bgSubtle rounded-sm border border-border flex items-center justify-between">
                          <span className="font-mono font-medium text-text truncate max-w-[140px]">{otherNode?.label || `#${otherId}`}</span>
                          <span className="text-[10px] font-mono text-accent font-bold">
                            {Math.round((e.confidence || 0) * 100)}% ({formatBasis(e.basis)})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border text-[10.5px] text-textFaint flex items-center justify-between">
              <span>Origin: Case #{selectedNode.case_id || caseNumber}</span>
              <button onClick={() => setSelectedNode(null)} className="text-accent hover:underline font-medium">
                Close panel
              </button>
            </div>
          </div>
        )}

        {/* Edge inspector */}
        {selectedEdge && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 bg-bg border border-border rounded-sm shadow-xl p-3 max-w-md w-full z-40 text-[12px] select-none animate-in fade-in duration-100">
            <div className="flex items-center justify-between border-b border-border pb-1.5 mb-2">
              <span className="font-bold text-text uppercase text-[10.5px]">Correlation rationale: {formatBasis(selectedEdge.basis)}</span>
              <button onClick={() => setSelectedEdge(null)} className="text-textDim hover:text-text">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] bg-bgSubtle p-1.5 rounded-sm">
              <span>{selectedEdge.sourceNode?.label}</span>
              <ArrowRight className="w-3 h-3 text-accent" />
              <span>{selectedEdge.targetNode?.label}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-textDim">Statistical correlation confidence:</span>
              <span className="font-mono font-bold text-accent">{Math.round((selectedEdge.confidence || 0) * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

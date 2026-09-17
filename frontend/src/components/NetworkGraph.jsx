import React, { useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";

export function formatBasis(basis) {
  if (!basis) return "Entity Link";
  const map = {
    shared_upi_handle: "Shared UPI Handle",
    shared_account: "Shared Account Number",
    shared_imei: "Shared Device (IMEI)",
    shared_imsi: "Shared SIM (IMSI)",
    shared_ip: "Shared Exact IP Address",
    shared_subnet: "Shared IP /24 Subnet",
    shared_phone: "Shared Phone Number",
    spoofed_caller_pattern: "Spoofed Caller Pattern",
    known_c2_server: "Known C2 Server Beacon",
    high_risk_permissions: "High Risk Permission Abuse",
  };
  return map[basis] || basis.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatEntityType(type) {
  if (!type) return "Entity";
  const map = {
    upi_handle: "UPI Handle",
    phone: "Phone Number",
    account: "Bank Account",
    imei: "Device IMEI",
    imsi: "Subscriber IMSI",
    ip_address: "IP Address",
    apk_hash: "APK Hash",
    url: "Target URL",
  };
  return map[type] || type.replace(/_/g, " ").toUpperCase();
}

const FILTER_OPTIONS = [
  { id: "all", label: "All entities" },
  { id: "phone", label: "Phone" },
  { id: "account", label: "Account" },
  { id: "upi_handle", label: "UPI handle" },
  { id: "imei", label: "IMEI" },
  { id: "imsi", label: "IMSI" },
  { id: "ip_address", label: "IP address" },
];

export default function NetworkGraph({
  nodes = [],
  edges = [],
  caseNumber = "",
  isLoading = false,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Compute node layout (Radial + Force simulation for clean court-usable spacing)
  const nodePositions = useMemo(() => {
    if (!nodes.length) return {};
    const width = 850;
    const height = 520;
    const centerX = width / 2;
    const centerY = height / 2;

    const positions = {};
    const count = nodes.length;

    if (count === 1) {
      positions[nodes[0].id] = { x: centerX, y: centerY };
      return positions;
    }

    // Assign positions on concentric rings based on degree / connectivity
    const degree = {};
    nodes.forEach((n) => (degree[n.id] = 0));
    edges.forEach((e) => {
      if (degree[e.source] !== undefined) degree[e.source]++;
      if (degree[e.target] !== undefined) degree[e.target]++;
    });

    // Sort by degree descending; top hubs in inner ring, peripheral in outer
    const sorted = [...nodes].sort((a, b) => degree[b.id] - degree[a.id]);

    const innerNodes = sorted.slice(0, Math.min(4, Math.ceil(count * 0.35)));
    const outerNodes = sorted.slice(innerNodes.length);

    // Inner circle
    const innerRadius = Math.min(140, 40 + count * 8);
    innerNodes.forEach((n, idx) => {
      const angle = (idx / innerNodes.length) * 2 * Math.PI - Math.PI / 2;
      positions[n.id] = {
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle),
      };
    });

    // Outer circle
    const outerRadius = Math.min(230, innerRadius + 100);
    outerNodes.forEach((n, idx) => {
      const angle = (idx / (outerNodes.length || 1)) * 2 * Math.PI - Math.PI / 3;
      positions[n.id] = {
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      };
    });

    return positions;
  }, [nodes, edges]);

  // Color lookup per risk level
  const getNodeColor = (risk) => {
    const norm = (risk || "").toLowerCase();
    if (norm === "high") return "var(--risk-high)";
    if (norm === "medium" || norm === "med") return "var(--risk-med)";
    if (norm === "low") return "var(--risk-low)";
    return "var(--text-dim)";
  };

  // Node Dimming based on filter
  const isNodeDimmed = (node) => {
    if (activeFilter === "all") return false;
    return node.entity_type !== activeFilter;
  };

  // Edge Dimming based on filter
  const isEdgeDimmed = (edge) => {
    if (activeFilter === "all") return false;
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    const sourceMatch = sourceNode && sourceNode.entity_type === activeFilter;
    const targetMatch = targetNode && targetNode.entity_type === activeFilter;
    return !(sourceMatch || targetMatch);
  };

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[520px] bg-bg border border-border rounded flex items-center justify-center text-textDim text-[13px]">
        Loading entity correlation graph...
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className="h-[520px] bg-bg border border-border rounded flex flex-col items-center justify-center text-center p-6">
        <Layers className="w-8 h-8 text-textFaint mb-2" />
        <h3 className="text-[14px] font-semibold text-text">No Entity Connections Generated</h3>
        <p className="text-[12px] text-textDim max-w-sm mt-1">
          Upload multi-source evidence (CDR, bank statements, or APK dumps) and trigger correlation to render the graph.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative bg-bg border border-border rounded flex flex-col select-none transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
          : "h-[560px] w-full"
      }`}
    >
      {/* 1. Toolbar */}
      <div className="h-12 px-3 border-b border-border bg-bg flex items-center justify-between gap-2 overflow-x-auto">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTER_OPTIONS.map((chip) => {
            const active = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`px-2.5 py-1 text-[11.5px] rounded transition-colors whitespace-nowrap font-medium ${
                  active
                    ? "bg-accentSoft text-accent border border-accentBorder font-semibold"
                    : "bg-bgSubtle text-textDim border border-border hover:text-text hover:bg-bgMuted"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Spacer & Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-border flex-shrink-0">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded text-textDim hover:text-text hover:bg-bgMuted transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded text-textDim hover:text-text hover:bg-bgMuted transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="p-1.5 rounded text-textDim hover:text-text hover:bg-bgMuted transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-border my-auto mx-0.5"></div>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
            className="p-1.5 rounded text-textDim hover:text-text hover:bg-bgMuted transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. SVG Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white cursor-grab active:cursor-grabbing">
        <svg
          viewBox="0 0 850 520"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`scale(${zoom})`} style={{ transformOrigin: "center center", transition: "transform 0.15s ease-out" }}>
            {/* Edge Lines */}
            {edges.map((edge) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const dimmed = isEdgeDimmed(edge);
              const conf = edge.confidence || 0;

              // Rule: solid + thicker for > 0.75, dashed + thinner for <= 0.65, medium otherwise
              let strokeWidth = 1.75;
              let strokeDasharray = "none";

              if (conf > 0.75) {
                strokeWidth = 2.75;
                strokeDasharray = "none";
              } else if (conf <= 0.65) {
                strokeWidth = 1.25;
                strokeDasharray = "4,4";
              }

              const isCrossCase = edge.extra && edge.extra.cross_case;
              const strokeColor = isCrossCase
                ? "var(--risk-high)"
                : dimmed
                ? "#E4E7EB"
                : "var(--border-strong)";

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
                    opacity={dimmed ? 0.2 : 0.85}
                    className="transition-opacity duration-150 cursor-pointer hover:stroke-accent"
                    onMouseEnter={() => {
                      const sourceNode = nodes.find((n) => n.id === edge.source);
                      const targetNode = nodes.find((n) => n.id === edge.target);
                      setHoveredEdge({
                        ...edge,
                        sourceLabel: sourceNode ? sourceNode.label : `#${edge.source}`,
                        targetLabel: targetNode ? targetNode.label : `#${edge.target}`,
                      });
                    }}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />
                  {/* Invisible wider stroke for easier edge hovering */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="transparent"
                    strokeWidth={14}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      const sourceNode = nodes.find((n) => n.id === edge.source);
                      const targetNode = nodes.find((n) => n.id === edge.target);
                      setHoveredEdge({
                        ...edge,
                        sourceLabel: sourceNode ? sourceNode.label : `#${edge.source}`,
                        targetLabel: targetNode ? targetNode.label : `#${edge.target}`,
                      });
                    }}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />
                </g>
              );
            })}

            {/* Node Circles & Labels */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const dimmed = isNodeDimmed(node);
              const nodeColor = getNodeColor(node.risk_level);
              const isCross = !!node.is_cross_case;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={dimmed ? 0.2 : 1}
                  className="cursor-pointer transition-opacity duration-150 group"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer ring for cross-case or high-risk entities */}
                  {isCross && (
                    <circle
                      r={18}
                      fill="none"
                      stroke="var(--risk-high)"
                      strokeWidth={1.5}
                      strokeDasharray="3,3"
                      className="animate-spin-slow"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={12}
                    fill={nodeColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="filter drop-shadow-sm transition-transform group-hover:scale-125"
                  />

                  {/* Label Text below node */}
                  <text
                    y={22}
                    textAnchor="middle"
                    className="text-[10.5px] font-mono fill-text font-medium pointer-events-none select-none"
                  >
                    {node.label && node.label.length > 18
                      ? `${node.label.substring(0, 16)}…`
                      : node.label}
                  </text>

                  {/* Entity Type subscript */}
                  <text
                    y={32}
                    textAnchor="middle"
                    className="text-[9px] fill-textFaint uppercase tracking-wider pointer-events-none select-none"
                  >
                    {formatEntityType(node.entity_type)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend watermark bottom-left */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-border rounded px-2.5 py-1.5 text-[11px] text-textDim flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-riskHigh"></span>
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-riskMed"></span>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-riskLow"></span>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-border pl-2">
            <span className="w-3.5 h-0.5 bg-text"></span>
            <span>Conf &gt; 75%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-b border-dashed border-textDim"></span>
            <span>Conf &le; 65%</span>
          </div>
        </div>

        {/* Node Hover Tooltip */}
        {hoveredNode && !hoveredEdge && (
          <div
            style={{
              position: "absolute",
              left: Math.min(tooltipPos.x, 580),
              top: Math.min(tooltipPos.y, 400),
              pointerEvents: "none",
            }}
            className="z-50 bg-bg border border-border rounded p-3 shadow-md max-w-xs text-[12px] space-y-1.5 animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-1">
              <span className="font-semibold text-text uppercase tracking-wider text-[10.5px]">
                {formatEntityType(hoveredNode.entity_type)}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                  hoveredNode.risk_level === "high"
                    ? "bg-riskHighBg text-riskHigh"
                    : hoveredNode.risk_level === "medium"
                    ? "bg-riskMedBg text-riskMed"
                    : "bg-riskLowBg text-riskLow"
                }`}
              >
                {hoveredNode.risk_level || "unscored"}
              </span>
            </div>
            <div className="font-mono text-[12px] text-text font-bold break-all">
              {hoveredNode.label}
            </div>
            <div className="text-[11px] text-textDim flex items-center gap-1">
              <Info className="w-3 h-3 text-textFaint flex-shrink-0" />
              <span>
                {hoveredNode.is_cross_case
                  ? `Linked across multiple cases (origin: Case #${hoveredNode.case_id})`
                  : `Case #${caseNumber || hoveredNode.case_id} local evidence`}
              </span>
            </div>
            {hoveredNode.anomaly_reason && (
              <div className="text-[10.5px] text-riskHigh bg-riskHighBg/60 p-1 rounded font-medium">
                {hoveredNode.anomaly_reason}
              </div>
            )}
          </div>
        )}

        {/* Edge Hover Court Rationale Tooltip */}
        {hoveredEdge && (
          <div
            style={{
              position: "absolute",
              left: Math.min(tooltipPos.x, 560),
              top: Math.min(tooltipPos.y, 380),
              pointerEvents: "none",
            }}
            className="z-50 bg-bg border border-border rounded p-3 shadow-md w-72 text-[12px] space-y-2 animate-in fade-in duration-100"
          >
            <div className="border-b border-border pb-1">
              <span className="text-[10.5px] font-semibold text-textFaint uppercase tracking-wider">
                Correlation Link Rationale
              </span>
              <div className="text-[12.5px] font-semibold text-text mt-0.5">
                {formatBasis(hoveredEdge.basis)}
              </div>
            </div>

            <div className="font-mono text-[11px] text-textDim flex items-center justify-between gap-1 bg-bgSubtle p-1.5 rounded">
              <span className="truncate max-w-[110px]" title={hoveredEdge.sourceLabel}>
                {hoveredEdge.sourceLabel}
              </span>
              <span className="text-textFaint">→</span>
              <span className="truncate max-w-[110px]" title={hoveredEdge.targetLabel}>
                {hoveredEdge.targetLabel}
              </span>
            </div>

            {/* Confidence Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-textDim">Confidence Score:</span>
                <span className="font-mono font-bold text-accent">
                  {Math.round((hoveredEdge.confidence || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-bgMuted h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.round((hoveredEdge.confidence || 0) * 100)}%` }}
                />
              </div>
            </div>

            {hoveredEdge.extra && hoveredEdge.extra.cross_case && (
              <div className="p-1 bg-riskHighBg border border-riskHigh/20 rounded text-[10.5px] text-riskHigh font-medium">
                Cross-case link to {hoveredEdge.extra.matched_case_number || "another case"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

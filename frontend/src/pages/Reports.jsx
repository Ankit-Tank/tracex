import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  ShieldAlert,
  ArrowLeft,
  Network,
  Download,
  AlertCircle,
  FileCheck,
  Shield,
  Layers,
} from "lucide-react";
import apiClient from "../api/client";
import ReportCard from "../components/ReportCard";

export default function Reports() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [allCases, setAllCases] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [takedownMatches, setTakedownMatches] = useState({
    url_matches: 0,
    apk_matches: 0,
    total_matches: 0,
  });

  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingTakedown, setIsGeneratingTakedown] = useState(false);
  const [briefHash, setBriefHash] = useState(null);
  const [takedownHash, setTakedownHash] = useState(null);
  const [error, setError] = useState(null);

  const loadCaseAndMatchData = async () => {
    try {
      const [cRes, mRes, casesRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}`),
        apiClient.get(`cases/${caseId}/reports/takedown-matches`),
        apiClient.get("cases"),
      ]);

      if (cRes.status === "fulfilled" && cRes.value) {
        setCaseData(cRes.value);
      }
      if (mRes.status === "fulfilled" && mRes.value) {
        setTakedownMatches(mRes.value);
      }
      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) {
        setAllCases(casesRes.value);
      }
    } catch (err) {
      console.error("Error loading case report metadata:", err);
    }
  };

  useEffect(() => {
    loadCaseAndMatchData();
  }, [caseId]);

  const cleanCaseNumber = caseData?.case_number?.replace("#", "").trim() || caseId;

  // Handle Investigative Brief PDF Generation & Download
  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    setError(null);
    try {
      const res = await apiClient.post(`cases/${caseId}/reports/investigative-brief`);

      // Extract SHA-256 header
      const hash =
        res.headers.get("X-Document-SHA256") ||
        res.headers.get("x-document-sha256");
      if (hash) setBriefHash(hash);

      // Download file in browser
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `investigative_brief_${cleanCaseNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to generate investigative brief.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Handle Takedown Request PDF Generation & Download
  const handleGenerateTakedown = async () => {
    setIsGeneratingTakedown(true);
    setError(null);
    try {
      const res = await apiClient.post(`cases/${caseId}/reports/takedown-request`);

      // Extract SHA-256 header and match count
      const hash =
        res.headers.get("X-Document-SHA256") ||
        res.headers.get("x-document-sha256");
      const matchedCount =
        res.headers.get("X-Matched-Count") ||
        res.headers.get("x-matched-count");

      if (hash) setTakedownHash(hash);
      if (matchedCount !== null && matchedCount !== undefined) {
        setTakedownMatches((prev) => ({
          ...prev,
          total_matches: parseInt(matchedCount, 10) || 0,
        }));
      }

      // Download file in browser
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `takedown_request_${cleanCaseNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Failed to generate takedown request.");
    } finally {
      setIsGeneratingTakedown(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-16">
      {/* 1. Page Head with Case Switcher */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text tracking-tight">
              Case <span className="font-mono text-accent">{caseData?.case_number || `#${caseId}`}</span> — Certified Investigative Dossiers
            </h1>

            {/* Quick Case Switcher */}
            {allCases.length > 1 && (
              <select
                value={caseId}
                onChange={(e) => navigate(`/cases/${e.target.value}/reports`)}
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
            Exports are cryptographically hash-stamped at generation time for Indian Evidence Act (Sec 65B) admissibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/cases/${caseId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded-md transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive graph</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations queue</span>
          </Link>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded-md text-riskHigh text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Two-Column Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Investigative Brief */}
        <ReportCard
          icon={FileText}
          title="Investigative Brief"
          description="A comprehensive single-page law enforcement dossier combining the AI narrative summary, risk-scored entity hierarchy, and immediate freeze directives."
          bullets={[
            "Executive case summary & risk-scored entity list",
            "Network graph snapshot & multi-hop connection metrics",
            "Recommended freeze-seizure targets (Sec 91 CrPC requisitions)",
          ]}
          buttonLabel="Generate investigative brief"
          onGenerate={handleGenerateBrief}
          isGenerating={isGeneratingBrief}
          sha256={briefHash}
        />

        {/* Card 2: Takedown Request */}
        <ReportCard
          icon={ShieldAlert}
          title="Takedown Request Package"
          description="Standardized statutory advisory package for domain registrars, hosting providers, and telecom intermediaries under Section 69A IT Act."
          bullets={[
            `${takedownMatches.url_matches} phishing URL / hosting indicators identified`,
            `${takedownMatches.apk_matches} malicious APK checksums cross-matched against CERT-In feeds`,
            `${takedownMatches.total_matches} total statutory takedown targets flagged across evidence`,
          ]}
          buttonLabel="Generate takedown request"
          onGenerate={handleGenerateTakedown}
          isGenerating={isGeneratingTakedown}
          sha256={takedownHash}
          footerNote="Matched against locally bundled indicator list — no live web call"
        />
      </div>
    </div>
  );
}

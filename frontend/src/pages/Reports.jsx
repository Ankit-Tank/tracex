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
} from "lucide-react";
import apiClient from "../api/client";
import ReportCard from "../components/ReportCard";

export default function Reports() {
  const { caseId } = useParams();
  const navigate = useNavigate();

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
      const [cRes, mRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}`),
        apiClient.get(`cases/${caseId}/reports/takedown-matches`),
      ]);

      if (cRes.status === "fulfilled" && cRes.value) {
        setCaseData(cRes.value);
      }
      if (mRes.status === "fulfilled" && mRes.value) {
        setTakedownMatches(mRes.value);
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Page Head */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text tracking-tight">
            Generate reports — case{" "}
            <span className="font-mono text-accent">
              {caseData?.case_number || `#${caseId}`}
            </span>
          </h1>
          <p className="text-[12.5px] text-textDim mt-0.5">
            Exports are hash-stamped at generation time for evidentiary integrity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/cases/${caseId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>View graph</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded text-riskHigh text-[12.5px] flex items-center gap-2">
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

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Shield,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  PhoneCall,
  Landmark,
  FileCode2,
} from "lucide-react";
import { apiClient } from "../api/client";

const SCAM_OPTIONS = [
  {
    id: "digital_scam",
    title: "Digital Scam",
    desc: "UPI fraud, fraudulent loan apps, part-time job & investment tasks",
    icon: Landmark,
  },
  {
    id: "phishing_vishing",
    title: "Phishing / Vishing",
    desc: "SIM swap, fake KYC calls, caller ID spoofing & bank impersonation",
    icon: PhoneCall,
  },
  {
    id: "malicious_apk",
    title: "Malicious APK",
    desc: "Trojanized APKs, SMS forwarders, accessibility service abuse & C2 beacons",
    icon: FileCode2,
  },
];

export default function NewInvestigationModal({ isOpen, onClose, onCaseCreated }) {
  const navigate = useNavigate();

  const [victimName, setVictimName] = useState("");
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scamType, setScamType] = useState("digital_scam");

  const [caseData, setCaseData] = useState(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const fileInputTelecomRef = useRef(null);
  const fileInputBankRef = useRef(null);
  const fileInputOtherRef = useRef(null);

  if (!isOpen) return null;

  // Helper to ensure case exists before uploading
  const ensureCaseCreated = async () => {
    if (caseData) return caseData;
    if (!victimName.trim()) {
      setError("Please enter the victim's name before uploading evidence.");
      return null;
    }

    setIsCreatingCase(true);
    setError(null);
    try {
      const created = await apiClient.post("cases", {
        victim_name: victimName.trim(),
        scam_type: scamType,
      });
      setCaseData(created);
      if (onCaseCreated) onCaseCreated(created);
      return created;
    } catch (err) {
      setError(err.message || "Failed to initialize case.");
      return null;
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleFileUpload = async (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const activeCase = await ensureCaseCreated();
    if (!activeCase) {
      e.target.value = "";
      return;
    }

    setUploadingCategory(category);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("evidence_category", category);

    try {
      const res = await apiClient.post(`cases/${activeCase.id}/evidence`, formData);
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: res.id,
          filename: res.original_filename,
          category: res.evidence_category,
          rowCount: res.row_count,
          sha256: res.sha256_hash,
          status: res.upload_status || "queued",
        },
      ]);
    } catch (err) {
      setError(err.message || `Failed to upload ${file.name}`);
    } finally {
      setUploadingCategory(null);
      e.target.value = "";
    }
  };

  const handleCorrelateAndOpen = async () => {
    if (!caseData) {
      setError("Please create a case and upload evidence first.");
      return;
    }

    setIsCorrelating(true);
    setError(null);

    try {
      // Trigger correlation engine
      await apiClient.post(`cases/${caseData.id}/correlate`);
      onClose();
      navigate(`/cases/${caseData.id}/graph`);
    } catch (err) {
      setError(err.message || "Correlation failed. Please check evidence files.");
      setIsCorrelating(false);
    }
  };

  const truncateHash = (hash) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-bg w-full max-w-2xl border border-border rounded shadow-lg overflow-hidden my-6">
        {/* Modal Header */}
        <div className="h-14 px-5 border-b border-border flex items-center justify-between bg-bg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-accent text-white flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-text leading-tight">
                New Cyber Fraud Investigation
              </h2>
              <p className="text-[11px] text-textDim leading-tight">
                Register incident & ingest multi-source evidence artifacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-textDim hover:text-text hover:bg-bgMuted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-riskHighBg border border-riskHigh/30 rounded text-riskHigh text-[12px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {caseData && (
            <div className="p-2.5 bg-accentSoft border border-accentBorder rounded text-accent text-[12px] flex items-center justify-between">
              <span className="font-medium">
                Case active:{" "}
                <strong className="font-mono font-bold">{caseData.case_number}</strong> —{" "}
                {caseData.victim_name}
              </span>
              <span className="text-[11px] uppercase font-mono px-2 py-0.5 bg-bg border border-accentBorder rounded">
                Ready for ingestion
              </span>
            </div>
          )}

          {/* Victim Name & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] font-medium text-textDim mb-1 uppercase tracking-wider">
                Victim's Full Name *
              </label>
              <input
                type="text"
                required
                disabled={!!caseData}
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 text-[13px] bg-bg border border-border rounded text-text placeholder-textFaint focus:outline-none focus:border-accent disabled:bg-bgSubtle"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-textDim mb-1 uppercase tracking-wider">
                Date of Case Registration
              </label>
              <input
                type="date"
                disabled={!!caseData}
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-bg border border-border rounded text-text font-mono disabled:bg-bgSubtle"
              />
            </div>
          </div>

          {/* Scam Type Selector */}
          <div>
            <label className="block text-[11.5px] font-medium text-textDim mb-2 uppercase tracking-wider">
              Scam Type Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SCAM_OPTIONS.map((opt) => {
                const isSelected = scamType === opt.id;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (!caseData) setScamType(opt.id);
                    }}
                    className={`p-3 rounded border text-left cursor-pointer transition-colors ${
                      isSelected
                        ? "border-accent bg-accentSoft text-accent"
                        : "border-border bg-bg hover:bg-bgSubtle text-text"
                    } ${caseData ? "opacity-80 cursor-default" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-accent" : "text-textDim"
                        }`}
                      />
                      <span className="text-[12.5px] font-semibold">{opt.title}</span>
                    </div>
                    <p className="text-[11px] text-textDim leading-snug line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Three Upload Zones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11.5px] font-medium text-textDim uppercase tracking-wider">
                Ingest Evidence Files
              </label>
              <span className="text-[11px] text-textFaint">
                CSV, XLSX, IPDR, CDR, or Forensic Logs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Telecom Drop Zone */}
              <div
                onClick={() => fileInputTelecomRef.current?.click()}
                className="border border-dashed border-border hover:border-accent hover:bg-bgSubtle rounded p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[95px]"
              >
                <input
                  type="file"
                  ref={fileInputTelecomRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt,.log"
                  onChange={(e) => handleFileUpload(e, "telecom")}
                />
                <PhoneCall className="w-5 h-5 text-accent mb-1.5" />
                <span className="text-[12px] font-medium text-text">Telecom Evidence</span>
                <span className="text-[10px] text-textDim mt-0.5">
                  {uploadingCategory === "telecom" ? "Ingesting..." : "CDR, IPDR, Cell Tower"}
                </span>
              </div>

              {/* Bank-UPI Drop Zone */}
              <div
                onClick={() => fileInputBankRef.current?.click()}
                className="border border-dashed border-border hover:border-accent hover:bg-bgSubtle rounded p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[95px]"
              >
                <input
                  type="file"
                  ref={fileInputBankRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt,.log"
                  onChange={(e) => handleFileUpload(e, "bank_upi")}
                />
                <Landmark className="w-5 h-5 text-accent mb-1.5" />
                <span className="text-[12px] font-medium text-text">Bank & UPI Evidence</span>
                <span className="text-[10px] text-textDim mt-0.5">
                  {uploadingCategory === "bank_upi" ? "Ingesting..." : "Statements, UPI Handles"}
                </span>
              </div>

              {/* Other Evidence Drop Zone */}
              <div
                onClick={() => fileInputOtherRef.current?.click()}
                className="border border-dashed border-border hover:border-accent hover:bg-bgSubtle rounded p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[95px]"
              >
                <input
                  type="file"
                  ref={fileInputOtherRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt,.log,.json"
                  onChange={(e) => handleFileUpload(e, "other")}
                />
                <FileSpreadsheet className="w-5 h-5 text-accent mb-1.5" />
                <span className="text-[12px] font-medium text-text">Other Artifacts</span>
                <span className="text-[10px] text-textDim mt-0.5">
                  {uploadingCategory === "other" ? "Ingesting..." : "APK Report, Intel, URLs"}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Table Live Status */}
          {uploadedFiles.length > 0 && (
            <div>
              <div className="text-[11.5px] font-medium text-textDim mb-1.5 uppercase tracking-wider">
                Ingested Artifacts ({uploadedFiles.length})
              </div>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead className="bg-bgSubtle border-b border-border text-[10.5px] uppercase tracking-wider font-semibold text-textFaint">
                    <tr>
                      <th className="py-2 px-3">Filename</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Rows</th>
                      <th className="py-2 px-3">SHA-256 Hash</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {uploadedFiles.map((f, i) => (
                      <tr key={i} className="hover:bg-bgSubtle">
                        <td className="py-2 px-3 font-mono font-medium text-text truncate max-w-[140px]">
                          {f.filename}
                        </td>
                        <td className="py-2 px-3 text-textDim capitalize">{f.category}</td>
                        <td className="py-2 px-3 font-mono text-text">{f.rowCount ?? "—"}</td>
                        <td className="py-2 px-3 font-mono text-textFaint text-[11px]">
                          {truncateHash(f.sha256)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-riskLow bg-riskLowBg px-1.5 py-0.5 rounded border border-riskLow/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Indexed</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-5 border-t border-border flex items-center justify-between bg-bgSubtle">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text hover:bg-bgMuted rounded transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!caseData || isCorrelating}
            onClick={handleCorrelateAndOpen}
            className="px-4 py-2 bg-accent hover:bg-accentHover disabled:opacity-50 text-white rounded text-[12.5px] font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isCorrelating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Correlating entities...</span>
              </>
            ) : (
              <>
                <span>Find connections & view graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

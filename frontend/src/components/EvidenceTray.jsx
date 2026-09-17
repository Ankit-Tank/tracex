import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export default function EvidenceTray({ files = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="py-4 text-center text-textDim text-[12.5px]">
        Checking evidence queue...
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="py-3 px-3 bg-bgSubtle border border-border rounded-sm flex items-center justify-between text-[12.5px] text-textDim">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-riskLow flex-shrink-0" />
          <span>All ingested evidence files across active cases have been normalized and indexed.</span>
        </div>
        <span className="text-[11px] text-textFaint font-mono">0 pending</span>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border border border-border rounded-sm">
      {files.map((file) => {
        const isProcessing = (file.upload_status || "").toLowerCase() === "processing";
        const formattedTime = file.uploaded_at
          ? new Date(file.uploaded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "just now";

        return (
          <div
            key={file.id}
            className="px-3.5 py-2.5 flex items-center justify-between hover:bg-bgSubtle transition-colors text-[13px]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  isProcessing ? "bg-accent animate-pulse" : "bg-riskMed"
                }`}
              />
              <div>
                <div className="font-mono text-[12.5px] text-text font-medium">
                  {file.original_filename}
                </div>
                <div className="text-[11px] text-textDim flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-semibold text-text">
                    Case {file.case_number || `#${file.case_id}`}
                  </span>
                  <span>·</span>
                  <span className="capitalize">{file.evidence_category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-textFaint" />
                    uploaded {formattedTime}
                  </span>
                </div>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase tracking-wider font-medium ${
                isProcessing
                  ? "bg-accentSoft text-accent border border-accentBorder"
                  : "bg-urgentBg text-urgentText border border-urgentBorder"
              }`}
            >
              {file.upload_status || "Queued"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

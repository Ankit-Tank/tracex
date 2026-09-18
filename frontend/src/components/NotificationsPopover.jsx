import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Network,
  ShieldAlert,
  Clock,
  ExternalLink,
  Check,
} from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Urgent Freeze Action Needed",
    desc: "Beneficiary UPI handle on Case #4471 flagged with confidence 0.95. Sec 91 CrPC freeze recommended.",
    time: "4 mins ago",
    caseId: "1",
    caseNumber: "#4471",
    type: "urgent",
    read: false,
  },
  {
    id: "notif-2",
    title: "Cross-Case Device Overlap",
    desc: "IMEI 860123456789012 matched between Case #4471 and Case #4472 across different IMSIs.",
    time: "18 mins ago",
    caseId: "2",
    caseNumber: "#4472",
    type: "correlation",
    read: false,
  },
  {
    id: "notif-3",
    title: "Threat Intelligence Match",
    desc: "APK checksum matched known Trojan malware family in CERT-In advisory repository.",
    time: "1 hour ago",
    caseId: "2",
    caseNumber: "#4472",
    type: "threat",
    read: true,
  },
  {
    id: "notif-4",
    title: "District Heatmap Updated",
    desc: "Automated IFSC & PIN resolution completed for 4 newly registered complaints.",
    time: "2 hours ago",
    type: "system",
    read: true,
  },
];

export default function NotificationsPopover({ isOpen, onClose, anchorRef }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    onClose();
    if (notif.caseId) {
      navigate(`/cases/${notif.caseId}/graph`);
    }
  };

  return (
    <div
      className="absolute right-0 mt-2 w-96 max-w-[92vw] bg-bg border border-border rounded-sm shadow-xl z-50 overflow-hidden text-text select-none animate-in fade-in duration-150"
      style={{ top: "100%" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bgSubtle">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <span className="text-[13px] font-semibold text-text">Operational Alerts</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-riskHigh text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[11px] text-accent hover:text-accentHover hover:underline flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
        {notifications.map((notif) => {
          let IconComponent = Bell;
          let iconColor = "text-accent";
          let bgPill = "bg-accentSoft";

          if (notif.type === "urgent") {
            IconComponent = AlertTriangle;
            iconColor = "text-riskHigh";
            bgPill = "bg-riskHighBg text-riskHigh";
          } else if (notif.type === "correlation") {
            IconComponent = Network;
            iconColor = "text-accent";
            bgPill = "bg-accentSoft text-accent";
          } else if (notif.type === "threat") {
            IconComponent = ShieldAlert;
            iconColor = "text-riskMed";
            bgPill = "bg-riskMedBg text-riskMed";
          }

          return (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 hover:bg-bgSubtle cursor-pointer transition-colors flex items-start gap-3 ${
                !notif.read ? "bg-accentSoft/30" : ""
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${bgPill}`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[12.5px] font-semibold text-text truncate">
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11.5px] text-textDim leading-snug">
                  {notif.desc}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10.5px] text-textFaint">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notif.time}
                  </span>
                  {notif.caseNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-semibold text-accent flex items-center gap-0.5">
                        {notif.caseNumber}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border bg-bgSubtle text-center">
        <span className="text-[11px] text-textFaint">
          Real-time updates from correlation & threat intel pipelines
        </span>
      </div>
    </div>
  );
}

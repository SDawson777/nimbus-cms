import React from "react";

export default function Badge({ children, tone = "info" }) {
  const tones = {
    info: { bg: "#DBEAFE", color: "#1E40AF" },
    success: { bg: "#D1FAE5", color: "#065F46" },
    warn: { bg: "#FEF3C7", color: "#92400E" },
    error: { bg: "#FEE2E2", color: "#991B1B" },
  };

  const style = tones[tone] || tones.info;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: 500,
        background: style.bg,
        color: style.color,
      }}
    >
      {children}
    </span>
  );
}

import React from "react";

export default function Input({ label, hint, error, ...props }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label && (
        <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
          {label}
        </span>
      )}
      <input
        style={{
          padding: "8px 12px",
          border: `1px solid ${error ? "#EF4444" : "#D1D5DB"}`,
          borderRadius: "6px",
          fontSize: 14,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        {...props}
      />
      {hint && !error && (
        <span style={{ fontSize: 12, color: "#6B7280" }}>{hint}</span>
      )}
      {error && <span style={{ fontSize: 12, color: "#EF4444" }}>{error}</span>}
    </label>
  );
}

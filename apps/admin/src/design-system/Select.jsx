import React from "react";

export default function Select({ label, options = [], ...props }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label && (
        <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
          {label}
        </span>
      )}
      <select
        style={{
          padding: "8px 12px",
          border: "1px solid #D1D5DB",
          borderRadius: "6px",
          fontSize: 14,
          background: "#fff",
          cursor: "pointer",
          outline: "none",
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

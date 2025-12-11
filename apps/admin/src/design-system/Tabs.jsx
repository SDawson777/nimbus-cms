import React from "react";

export default function Tabs({ tabs = [], activeId, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        borderBottom: "1px solid #E5E7EB",
        marginBottom: 24,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            background: "none",
            border: "none",
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 500,
            color: activeId === tab.id ? "#3F7AFC" : "#6B7280",
            cursor: "pointer",
            borderBottom:
              activeId === tab.id
                ? "2px solid #3F7AFC"
                : "2px solid transparent",
            marginBottom: "-1px",
            transition: "all 0.2s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

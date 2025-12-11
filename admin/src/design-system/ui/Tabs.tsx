import React from "react";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
};

export default function Tabs({ tabs, activeId, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        borderBottom: "1px solid var(--color-border)",
        marginBottom: 16,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "8px 12px",
            border: "none",
            background: "transparent",
            borderBottom:
              activeId === t.id
                ? "2px solid var(--color-primary)"
                : "2px solid transparent",
            color:
              activeId === t.id ? "var(--color-primary)" : "var(--color-text)",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

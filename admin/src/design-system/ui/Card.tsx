import React from "react";
/**
 * Card — Nimbus Design System
 * - padding: 24px
 * - shadow: sm or md via token
 * - radius: lg
 */
export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--elevation-sm)",
        background: "var(--color-surface)",
      }}
    >
      {children}
    </div>
  );
}

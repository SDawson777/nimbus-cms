import React from "react";

type Props = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};
export default function FormField({ label, hint, error, children }: Props) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
        {label}
      </span>
      {children}
      <div style={{ display: "flex", gap: 8 }}>
        {hint && (
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {hint}
          </span>
        )}
        {error && (
          <span style={{ fontSize: 12, color: "var(--color-error)" }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

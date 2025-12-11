import React, { useState } from "react";

type Props = { content: React.ReactNode; children: React.ReactNode };
export default function Tooltip({ content, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 8px",
            boxShadow: "var(--elevation-sm)",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

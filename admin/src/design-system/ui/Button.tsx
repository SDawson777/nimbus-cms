import React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled,
  onClick,
}: Props) {
  const bg =
    variant === "primary"
      ? "var(--color-primary)"
      : variant === "secondary"
        ? "var(--color-muted)"
        : "transparent";
  const color = variant === "ghost" ? "var(--color-text)" : "white";
  const pad =
    size === "sm" ? "6px 10px" : size === "lg" ? "12px 18px" : "8px 14px";
  const border = variant === "ghost" ? "1px solid var(--color-border)" : "none";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        color,
        padding: pad,
        border,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--elevation-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

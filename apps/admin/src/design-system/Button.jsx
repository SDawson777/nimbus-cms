import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles = {
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    transition: "all 0.2s",
    opacity: disabled ? 0.6 : 1,
  };

  const variants = {
    primary: {
      background: "#3F7AFC",
      color: "#fff",
      ":hover": { background: "#2563eb" },
    },
    secondary: {
      background: "#E5E7EB",
      color: "#374151",
      ":hover": { background: "#D1D5DB" },
    },
    ghost: {
      background: "transparent",
      color: "#374151",
      ":hover": { background: "#F3F4F6" },
    },
  };

  const sizes = {
    sm: { padding: "6px 12px", fontSize: "14px" },
    md: { padding: "8px 16px", fontSize: "14px" },
    lg: { padding: "12px 24px", fontSize: "16px" },
  };

  const style = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
  };

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

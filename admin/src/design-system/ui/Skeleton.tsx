import React from "react";

type Props = { width?: number | string; height?: number | string };
export default function Skeleton({ width = "100%", height = 16 }: Props) {
  return (
    <div
      style={{
        width,
        height,
        background: "var(--color-muted)",
        borderRadius: "var(--radius-sm)",
        animation: "pulse 1.5s infinite",
      }}
    />
  );
}

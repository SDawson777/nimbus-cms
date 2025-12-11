import React, { useMemo } from "react";
import "./reset.css";
import "./global.css";
import { tokens } from "./tokens";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const vars = useMemo(() => {
    const cssVars: Record<string, string> = {};
    Object.entries(tokens.colors).forEach(
      ([k, v]) => (cssVars[`--color-${k}`] = v),
    );
    Object.entries(tokens.radius).forEach(
      ([k, v]) => (cssVars[`--radius-${k}`] = v),
    );
    Object.entries(tokens.elevation).forEach(
      ([k, v]) => (cssVars[`--elevation-${k}`] = v as string),
    );
    cssVars["--font-sans"] = tokens.typography.fontSans;
    cssVars["--font-mono"] = tokens.typography.fontMono;
    return cssVars;
  }, []);

  return (
    <div style={vars as React.CSSProperties} data-theme="light">
      {children}
    </div>
  );
}

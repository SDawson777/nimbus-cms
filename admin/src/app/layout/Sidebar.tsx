import React from "react";
import NavigationItems from "./NavigationItems";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sidebar" style={{ padding: "16px 0" }}>
      <div
        style={{
          padding: "0 16px",
          marginBottom: 24,
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        Nimbus Admin
      </div>
      <nav style={{ display: "grid", gap: 4 }}>
        {NavigationItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                color: active ? "var(--color-primary)" : "var(--color-text)",
                background: active ? "var(--color-muted)" : "transparent",
                textDecoration: "none",
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

import React from "react";
import { WorkspaceSelector } from "@/modules/tenants/TenantContext";
import { NIMBUS_API_URL } from "@/lib/api";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">Dashboard</span>
      </div>
      <div className="topbar-right">
        <span className="api-hint">
          API: {NIMBUS_API_URL || "configure VITE_NIMBUS_API_URL"}
        </span>
        <WorkspaceSelector />
      </div>
    </header>
  );
}

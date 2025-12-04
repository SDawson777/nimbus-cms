import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

const defaultTheme = {
  palette: {
    primaryColor: "#3b82f6",
    accentColor: "#22c55e",
    backgroundColor: "#020617",
    surfaceColor: "#0f172a",
    textColor: "#e5e7eb",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    headingFont: "Space Grotesk",
    baseSize: "16px",
  },
  mode: "dark",
  assets: { logoUrl: "/nimbus-icon.svg" },
};

export default function ThemePage() {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [theme, setTheme] = useState(defaultTheme);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const loadTenants = async () => {
    const res = await apiJson("/api/admin/control/tenants");
    if (res.ok) {
      setTenants(res.data.items || []);
      if (!tenantId && res.data.items?.length)
        setTenantId(res.data.items[0].id);
    }
  };

  const loadTheme = async (id) => {
    if (!id) return;
    const res = await apiJson(`/api/admin/control/theme/${id}`);
    if (res.ok) setTheme(res.data);
    else setTheme({ ...defaultTheme, tenantId: id });
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (tenantId) loadTheme(tenantId);
  }, [tenantId]);

  const updatePalette = (key, value) => {
    setTheme((t) => ({ ...t, palette: { ...t.palette, [key]: value } }));
  };

  const updateTypography = (key, value) => {
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value } }));
  };

  const save = async () => {
    if (!tenantId) return;
    setToast("");
    setError("");
    const res = await apiJson(`/api/admin/control/theme/${tenantId}`, {
      method: "POST",
      body: JSON.stringify({ ...theme, tenantId }),
    });
    if (res.ok) setToast("Theme saved");
    else setError(res.data?.error || "Save failed");
  };

  return (
    <div className="theme-page">
      <div
        className="theme-preview-bar"
        style={{
          background: theme.palette.backgroundColor,
          color: theme.palette.textColor,
          borderColor: theme.palette.accentColor,
          fontFamily: theme.typography?.fontFamily,
        }}
      >
        <div
          className="preview-logo"
          style={{ background: theme.palette.primaryColor }}
        />
        <div className="preview-text">
          <div className="preview-title">Nimbus CMS Suite</div>
          <div className="preview-sub">Live preview</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: "1rem" }}>
        <label>
          Tenant
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="theme-grid">
        <label>
          Primary color
          <input
            type="color"
            value={theme.palette.primaryColor}
            onChange={(e) => updatePalette("primaryColor", e.target.value)}
          />
        </label>
        <label>
          Accent color
          <input
            type="color"
            value={theme.palette.accentColor}
            onChange={(e) => updatePalette("accentColor", e.target.value)}
          />
        </label>
        <label>
          Background color
          <input
            type="color"
            value={theme.palette.backgroundColor}
            onChange={(e) => updatePalette("backgroundColor", e.target.value)}
          />
        </label>
        <label>
          Surface color
          <input
            type="color"
            value={theme.palette.surfaceColor}
            onChange={(e) => updatePalette("surfaceColor", e.target.value)}
          />
        </label>
        <label>
          Font color
          <input
            type="color"
            value={theme.palette.textColor}
            onChange={(e) => updatePalette("textColor", e.target.value)}
          />
        </label>
        <label>
          Typography (body)
          <input
            value={theme.typography?.fontFamily || ""}
            onChange={(e) => updateTypography("fontFamily", e.target.value)}
            placeholder="Inter, sans-serif"
          />
        </label>
        <label>
          Typography (heading)
          <input
            value={theme.typography?.headingFont || ""}
            onChange={(e) => updateTypography("headingFont", e.target.value)}
            placeholder="Space Grotesk"
          />
        </label>
      </div>
      <button className="btn primary" onClick={save}>
        Save theme
      </button>
      <div className="toolbar" style={{ marginTop: "0.5rem" }}>
        {toast && <span className="pill success">{toast}</span>}
        {error && <span className="pill danger">{error}</span>}
      </div>
    </div>
  );
}

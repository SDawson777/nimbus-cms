import React, { useEffect, useState } from "react";
import Card from "../design-system/Card";
import Input from "../design-system/Input";
import Select from "../design-system/Select";
import Button from "../design-system/Button";
import { useDatasetConfig } from "../lib/datasetContext";
import {
  fetchNotificationPrefs,
  saveNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  fetchDashboardLayout,
  saveDashboardLayout,
  DEFAULT_LAYOUT,
} from "../lib/preferences";

const UI_STORAGE_KEY = "nimbus_admin_ui";
const DEFAULT_UI = {
  theme: "auto",
  primary: "#3b82f6",
  accent: "#8b5cf6",
  density: "balanced",
  surfaces: "glass",
  radius: 14,
  blur: 16,
  shadow: "balanced",
  font: "inter",
  headingScale: "md",
  border: "hairline",
  surfaceTint: "#0f172a",
  glow: "soft",
  showPreview: true,
};

function loadUiPrefs() {
  try {
    return {
      ...DEFAULT_UI,
      ...(JSON.parse(localStorage.getItem(UI_STORAGE_KEY)) || {}),
    };
  } catch (e) {
    return DEFAULT_UI;
  }
}

function persistUiPrefs(prefs) {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    /* no-op */
  }
}

function applyUiTokens(prefs) {
  const root = document.documentElement;
  root.dataset.theme = prefs.theme;
  root.style.setProperty("--primary", prefs.primary || prefs.accent);
  root.style.setProperty("--accent-solid", prefs.accent);
  root.style.setProperty(
    "--accent",
    `linear-gradient(135deg, ${prefs.accent} 0%, #22d3ee 100%)`,
  );
  root.style.setProperty(
    "--card",
    prefs.surfaces === "glass" ? "rgba(12, 20, 36, 0.85)" : "#0c1424",
  );
  root.style.setProperty("--surface-tint", prefs.surfaceTint || "#0f172a");
  root.style.setProperty(
    "--panel-padding",
    prefs.density === "compact"
      ? "12px 12px"
      : prefs.density === "spacious"
        ? "18px 20px"
        : "14px 16px",
  );
  root.style.setProperty(
    "--section-gap",
    prefs.density === "compact"
      ? "12px"
      : prefs.density === "spacious"
        ? "20px"
        : "16px",
  );
  root.style.setProperty("--radius", `${prefs.radius || 14}px`);
  root.style.setProperty("--chrome-blur", `${prefs.blur || 16}px`);
  root.style.setProperty(
    "--border-weight",
    prefs.border === "bold" ? "1.5px" : prefs.border === "none" ? "0px" : "1px",
  );
  root.style.setProperty(
    "--shadow",
    prefs.shadow === "soft"
      ? "0 18px 38px rgba(0,0,0,0.28)"
      : prefs.shadow === "bold"
        ? "0 28px 80px rgba(0,0,0,0.48)"
        : "0 24px 64px rgba(0,0,0,0.38)",
  );
  root.style.setProperty(
    "--glow",
    prefs.glow === "bold"
      ? "0 0 22px rgba(124, 58, 237, 0.35)"
      : prefs.glow === "minimal"
        ? "0 0 8px rgba(34, 211, 238, 0.14)"
        : "0 0 14px rgba(124, 58, 237, 0.22)",
  );
  const fontFamily =
    prefs.font === "serif"
      ? '"Source Serif Pro", "Georgia", serif'
      : prefs.font === "mono"
        ? '"JetBrains Mono", "SFMono-Regular", monospace'
        : 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
  root.style.setProperty("--font-body", fontFamily);
  const headingScale =
    prefs.headingScale === "lg" ? 1.08 : prefs.headingScale === "sm" ? 0.94 : 1;
  root.style.setProperty("--heading-scale", headingScale);
}

export default function Settings() {
  return (
    <div className="settings-shell">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Control surface</p>
          <h1>Admin Settings</h1>
          <p className="subdued">
            Align admin and CMS behaviors across datasets, surfaces, and
            authentication. Everything here is safe for handoff—no mystery
            switches.
          </p>
        </div>
        <div className="settings-badges">
          <span className="pill">Enterprise-ready</span>
          <span className="pill">Multi-tenant</span>
          <span className="pill">AI-assisted</span>
        </div>
      </div>

      <Card>
        <ExperienceSettings />
        <ApiKeysSettings />
        <WorkspaceSettings />
      </Card>
    </div>
  );
}

function ExperienceSettings() {
  const [uiPrefs, setUiPrefs] = useState(loadUiPrefs());
  const [status, setStatus] = useState("");
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [layoutStatus, setLayoutStatus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    (async function () {
      const saved = await fetchDashboardLayout();
      if (saved?.layout) setLayout(saved.layout);
    })();
  }, []);

  useEffect(() => {
    applyUiTokens(uiPrefs);
  }, [uiPrefs]);

  function update(key, value) {
    setUiPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    persistUiPrefs(uiPrefs);
    applyUiTokens(uiPrefs);
    setStatus("Applied to Admin + Studio surfaces");
    setTimeout(() => setStatus(""), 2800);
  }

  function reset() {
    setUiPrefs(DEFAULT_UI);
    persistUiPrefs(DEFAULT_UI);
    applyUiTokens(DEFAULT_UI);
    setStatus("Reset to Nimbus defaults");
    setTimeout(() => setStatus(""), 2400);
  }

  const toggleCard = (id) => {
    const hidden = new Set(layout.hidden);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    const next = { ...layout, hidden: Array.from(hidden) };
    setLayout(next);
  };

  const toggleFavorite = (id) => {
    const favs = new Set(layout.favorites);
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    const next = { ...layout, favorites: Array.from(favs) };
    setLayout(next);
  };

  const moveCard = (id, dir) => {
    const order = [...layout.order];
    const idx = order.indexOf(id);
    const swap = idx + dir;
    if (idx === -1 || swap < 0 || swap >= order.length) return;
    [order[idx], order[swap]] = [order[swap], order[idx]];
    setLayout({ ...layout, order });
  };

  async function saveLayoutPrefs() {
    setLayoutStatus("Saving…");
    await saveDashboardLayout(layout);
    setLayoutStatus("Saved");
    setTimeout(() => setLayoutStatus(""), 2400);
  }

  return (
    <div className="settings-grid">
      <div className="settings-panel">
        <h3>Appearance</h3>
        <p className="subdued">
          Choose the core colors, mode, and typography for Nimbus. Keep things
          simple for buyers, and only open advanced controls when you need them.
        </p>

        <div className="field-row">
          <label className="field">
            <span className="field-label">Primary colour</span>
            <input
              type="color"
              value={uiPrefs.primary}
              onChange={(e) => update("primary", e.target.value)}
              style={{
                height: 42,
                width: 96,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          </label>
          <label className="field">
            <span className="field-label">Accent colour</span>
            <input
              type="color"
              value={uiPrefs.accent}
              onChange={(e) => update("accent", e.target.value)}
              style={{
                height: 42,
                width: 96,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          </label>
        </div>

        <Select
          label="Light vs. Dark"
          value={uiPrefs.theme}
          onChange={(e) => update("theme", e.target.value)}
          options={[
            { value: "auto", label: "Auto (follow device)" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />

        <Select
          label="Font family"
          value={uiPrefs.font}
          onChange={(e) => update("font", e.target.value)}
          options={[
            { value: "inter", label: "Sans (Inter)" },
            { value: "serif", label: "Serif" },
            { value: "mono", label: "Mono" },
          ]}
        />

        <label className="field checkbox">
          <input
            type="checkbox"
            checked={uiPrefs.showPreview}
            onChange={(e) => update("showPreview", e.target.checked)}
          />
          <span className="field-label">Show live preview</span>
        </label>

        <Button
          variant="ghost"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{ alignSelf: "flex-start" }}
        >
          {showAdvanced
            ? "Hide advanced theme controls"
            : "Show advanced controls"}
        </Button>

        {showAdvanced && (
          <div className="stack" style={{ gap: 12 }}>
            <div className="field-row">
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Corner radius</span>
                <input
                  type="range"
                  min="8"
                  max="22"
                  value={uiPrefs.radius}
                  onChange={(e) => update("radius", Number(e.target.value))}
                />
                <span className="metric-subtle">{uiPrefs.radius}px</span>
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">Surface blur</span>
                <input
                  type="range"
                  min="8"
                  max="28"
                  value={uiPrefs.blur}
                  onChange={(e) => update("blur", Number(e.target.value))}
                />
                <span className="metric-subtle">{uiPrefs.blur}px</span>
              </label>
            </div>

            <Select
              label="Surface style"
              value={uiPrefs.surfaces}
              onChange={(e) => update("surfaces", e.target.value)}
              options={[
                { value: "glass", label: "Glassmorphic" },
                { value: "solid", label: "Solid panels" },
              ]}
            />
            <Select
              label="Border weight"
              value={uiPrefs.border}
              onChange={(e) => update("border", e.target.value)}
              options={[
                { value: "none", label: "None" },
                { value: "hairline", label: "Hairline" },
                { value: "bold", label: "Bold" },
              ]}
            />
          </div>
        )}

        <div className="action-row">
          <Button variant="primary" onClick={save}>
            Save & apply
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
          {status && <span className="status-chip">{status}</span>}
        </div>

        <div className="divider" />

        <h3>Dashboard layout</h3>
        <p className="subdued">
          Show or hide widgets, drag priorities with the arrows, and mark quick
          favorites. Save this layout as the default for everyone using the
          workspace.
        </p>

        <div className="customizer">
          {layout.order.map((id) => (
            <div key={id} className="customizer-row">
              <div>
                <strong>{id}</strong>
                <p className="section-note" style={{ margin: 0 }}>
                  {DEFAULT_LAYOUT.order.includes(id) ? "Core widget" : "Widget"}{" "}
                  · Priority and visibility
                </p>
              </div>
              <div className="customizer-actions">
                <button
                  className="ghost"
                  onClick={() => moveCard(id, -1)}
                  aria-label={`Move ${id} up`}
                >
                  ↑
                </button>
                <button
                  className="ghost"
                  onClick={() => moveCard(id, 1)}
                  aria-label={`Move ${id} down`}
                >
                  ↓
                </button>
                <button
                  className="ghost"
                  onClick={() => toggleCard(id)}
                  aria-pressed={!layout.hidden.includes(id)}
                >
                  {layout.hidden.includes(id) ? "Show" : "Hide"}
                </button>
                <button
                  className="ghost"
                  onClick={() => toggleFavorite(id)}
                  aria-pressed={layout.favorites.includes(id)}
                >
                  {layout.favorites.includes(id) ? "★" : "☆"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="action-row">
          <Button variant="primary" onClick={saveLayoutPrefs}>
            Save default layout
          </Button>
          {layoutStatus && <span className="status-chip">{layoutStatus}</span>}
        </div>
      </div>

      <div className="settings-preview">
        {uiPrefs.showPreview && (
          <div className="preview-card stack">
            <p className="eyebrow">Live preview</p>
            <h4>Admin & CMS surfaces</h4>
            <p className="subdued">
              Buyers see this styling across dashboards, Studio, and CMS chrome.
              Keep it clean; hide the advanced knobs when handing off.
            </p>
            <div className="preview-grid">
              <div className="preview-pill">Theme: {uiPrefs.theme}</div>
              <div className="preview-pill">Primary: {uiPrefs.primary}</div>
              <div className="preview-pill">Accent: {uiPrefs.accent}</div>
              <div className="preview-pill">Font: {uiPrefs.font}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ApiKeysSettings() {
  const {
    projectId,
    datasets,
    activeDataset,
    setProjectId,
    addDataset,
    removeDataset,
    setActiveDataset,
  } = useDatasetConfig();
  const [datasetDraft, setDatasetDraft] = useState("");
  const [tenantName, setTenantName] = useState("Nimbus Tenant");

  return (
    <div className="settings-grid">
      <div className="settings-panel">
        <h3>CMS & Data</h3>
        <p className="subdued">
          Manage Sanity projects and datasets per tenant. Keep production safe
          while letting buyers explore staging sandboxes without hunting for
          docs.
        </p>

        <Input
          label="Tenant name"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="Tenant shown in CMS"
        />
        <Input
          label="Sanity Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID"
          hint="Found in your Sanity project settings"
        />

        <div className="field-row">
          <Input
            label="Add dataset"
            value={datasetDraft}
            onChange={(e) => setDatasetDraft(e.target.value)}
            placeholder="production, staging, qa..."
          />
          <Button
            variant="primary"
            onClick={() => {
              addDataset(datasetDraft);
              setDatasetDraft("");
            }}
            disabled={!datasetDraft.trim()}
            style={{ whiteSpace: "nowrap" }}
          >
            Add dataset
          </Button>
        </div>

        <div className="dataset-chips">
          {datasets.map((ds) => (
            <div
              key={ds}
              className={`dataset-chip ${ds === activeDataset ? "is-active" : ""}`}
            >
              <div>
                <p className="eyebrow">Dataset</p>
                <strong>{ds}</strong>
              </div>
              <div className="chip-actions">
                <Button
                  variant="ghost"
                  onClick={() => setActiveDataset(ds)}
                  disabled={ds === activeDataset}
                >
                  {ds === activeDataset ? "Active" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => removeDataset(ds)}
                  disabled={datasets.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Select
          label="Active dataset"
          value={activeDataset}
          onChange={(e) => setActiveDataset(e.target.value)}
          options={datasets.map((ds) => ({ value: ds, label: ds }))}
        />
        <p className="subdued">
          Admin dashboards, content tables, AI concierge signals, and compliance
          widgets will read from the active dataset above. Update the tenant
          name to keep multi-tenant handoffs clear.
        </p>
      </div>

      <div className="settings-preview">
        <div className="preview-card stack">
          <p className="eyebrow">Alignment</p>
          <h4>API posture</h4>
          <p className="subdued">
            Project + dataset settings are shared across Admin & CMS. Keep
            production safe while letting buyers tour staging or demo sandboxes
            with the same chrome.
          </p>
          <div className="preview-grid muted">
            <div className="preview-pill">
              Project ID: {projectId || "not set"}
            </div>
            <div className="preview-pill">Active dataset: {activeDataset}</div>
            <div className="preview-pill">AI concierge: synced</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState("Nimbus HQ");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [contact, setContact] = useState("team@nimbus.app");
  const [notificationPrefs, setNotificationPrefs] = useState(
    DEFAULT_NOTIFICATION_PREFS,
  );
  const [notifStatus, setNotifStatus] = useState("");

  useEffect(() => {
    async function loadPrefs() {
      const { preferences } = await fetchNotificationPrefs();
      setNotificationPrefs(preferences);
    }
    loadPrefs();
  }, []);

  const toggleChannel = (key) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      channels: { ...prev.channels, [key]: !prev.channels[key] },
    }));
  };

  const setFrequency = (value) => {
    setNotificationPrefs((prev) => ({ ...prev, frequency: value }));
  };

  const toggleTrigger = (trigger) => {
    setNotificationPrefs((prev) => {
      const set = new Set(prev.triggers);
      if (set.has(trigger)) set.delete(trigger);
      else set.add(trigger);
      return { ...prev, triggers: Array.from(set) };
    });
  };

  const saveNotifications = async () => {
    const { ok } = await saveNotificationPrefs(notificationPrefs);
    setNotifStatus(ok ? "Saved" : "Unable to save");
    setTimeout(() => setNotifStatus(""), 2600);
  };

  return (
    <div className="settings-grid">
      <div className="settings-panel">
        <h3>Notifications</h3>
        <p className="subdued">
          Choose delivery, cadence, and triggers for ops and buyer alerts. Keep
          it simple: SMS/email wiring can happen later while in-app alerts stay
          live.
        </p>

        <div className="field-row">
          {["sms", "email", "inApp"].map((channel) => (
            <label key={channel} className="field checkbox">
              <input
                type="checkbox"
                checked={notificationPrefs.channels[channel]}
                onChange={() => toggleChannel(channel)}
              />
              <span className="field-label">{channel.toUpperCase()}</span>
            </label>
          ))}
        </div>

        <Select
          label="Frequency"
          value={notificationPrefs.frequency}
          onChange={(e) => setFrequency(e.target.value)}
          options={[
            { value: "realtime", label: "Real-time" },
            { value: "hourly", label: "Hourly digest" },
            { value: "daily", label: "Daily digest" },
            { value: "weekly", label: "Weekly" },
          ]}
        />

        <div className="trigger-grid">
          {[
            { id: "revenue_spike", label: "Revenue spike" },
            { id: "error_rate", label: "Error rate" },
            { id: "store_offline", label: "Store offline" },
            { id: "active_users_drop", label: "Active users drop" },
          ].map((trigger) => (
            <label key={trigger.id} className="field checkbox">
              <input
                type="checkbox"
                checked={notificationPrefs.triggers.includes(trigger.id)}
                onChange={() => toggleTrigger(trigger.id)}
              />
              <span className="field-label">{trigger.label}</span>
            </label>
          ))}
        </div>

        <div className="action-row">
          <Button variant="primary" onClick={saveNotifications}>
            Save alerts
          </Button>
          {notifStatus && <span className="status-chip">{notifStatus}</span>}
        </div>

        <div className="divider" />

        <h3>Workspace</h3>
        <p className="subdued">
          Label the workspace buyers log into and set sensible defaults for
          language, time, and contact. Keep rarely used knobs out of sight.
        </p>

        <Input
          label="Workspace name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="My Workspace"
        />

        <div className="field-row">
          <Select
            label="Default language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: "en", label: "English" },
              { value: "es", label: "Spanish" },
              { value: "fr", label: "French" },
            ]}
          />

          <Select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={[
              { value: "UTC", label: "UTC" },
              { value: "America/New_York", label: "Eastern Time" },
              { value: "America/Los_Angeles", label: "Pacific Time" },
            ]}
          />
        </div>

        <Input
          label="Contact details"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email or phone buyers should reach"
        />
      </div>

      <div className="settings-preview">
        <div className="preview-card stack">
          <p className="eyebrow">Security posture</p>
          <h4>Login guard</h4>
          <p className="subdued">
            All admin routes are protected. Buyers can test with the demo
            account before wiring SSO or your production auth provider.
          </p>
          <div className="preview-grid muted">
            <div className="preview-pill">Email: demo@nimbus.app</div>
            <div className="preview-pill">Password: Nimbus!Demo123</div>
            <div className="preview-pill">Role: ORG_ADMIN</div>
          </div>
        </div>
      </div>
    </div>
  );
}

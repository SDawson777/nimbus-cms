import React, { useCallback, useEffect, useState } from "react";
import { apiJson, apiFetch } from "../lib/api";
import { t } from '../lib/i18n';
import { useTenant } from "../lib/tenantContext";
import { useAdmin } from "../lib/adminContext";

export default function Legal() {
  const [items, setItems] = useState([]);
  const { tenantId } = useTenant();
  const { capabilities } = useAdmin();

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    type: "terms",
    stateCode: "",
    version: "1.0",
    effectiveFrom: new Date().toISOString().split("T")[0],
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const canManage = !!capabilities?.canManageLegal || !!capabilities?.canManageContent;

  const loadDocs = useCallback(async (signal) => {
    try {
      const { ok, data, aborted } = await apiJson(
        "/api/admin/legal",
        { signal },
        [],
      );
      if (aborted || signal?.aborted) return;
      if (ok) {
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDocs(controller.signal);
    return () => controller.abort();
  }, [tenantId, loadDocs]);

  async function handleCreateDoc(e) {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const body = {
        title: createForm.title.trim(),
        type: createForm.type,
        stateCode: createForm.stateCode || null,
        version: createForm.version || "1.0",
        effectiveFrom: createForm.effectiveFrom || new Date().toISOString().split("T")[0],
      };
      const res = await apiFetch("/api/admin/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create document");
      }
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        type: "terms",
        stateCode: "",
        version: "1.0",
        effectiveFrom: new Date().toISOString().split("T")[0],
      });
      loadDocs();
    } catch (err) {
      console.error("create legal doc failed", err);
      setCreateError(err?.message || "Failed to create document");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>{t('legal_title')}</h1>
        {canManage && (
          <button type="button" onClick={() => setShowCreateModal(true)}>
            Create
          </button>
        )}
      </div>
      <div className="card" style={{ marginBottom: 16, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Data &amp; AI Usage</h3>
        <p style={{ margin: "4px 0" }}>
          Nimbus surfaces optional AI assistance for admins. Inputs are limited
          to the prompts you provide, and no training or retention occurs
          server-side unless the API backend enables it via environment flags.
          Buyers should review their own data handling policies before enabling
          production AI endpoints.
        </p>
        <p style={{ margin: "4px 0" }}>
          For privacy requests or data export, reach the team at{" "}
          <a href="mailto:privacy@nimbus.app">privacy@nimbus.app</a>.
        </p>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>State</th>
            <th>Version</th>
            <th>Effective From</th>
            <th>Channels</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td>{d.title}</td>
              <td>{d.type}</td>
              <td>{d.stateCode || "Global"}</td>
              <td>{d.version}</td>
              <td>{d.effectiveFrom}</td>
              <td>
                {Array.isArray(d.channels) && d.channels.length
                  ? d.channels.join(", ")
                  : "Global"}
              </td>
              <td>
                <a href="/studio" target="_blank" rel="noreferrer">
                  Open in Studio
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Create Legal Document Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            width: 450,
            maxHeight: "80vh",
            overflow: "auto",
          }}>
            <h2 style={{ marginTop: 0 }}>Create Legal Document</h2>
            <form onSubmit={handleCreateDoc}>
              <label style={{ display: "block", marginBottom: 12 }}>
                Title *
                <input
                  name="title"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                  style={{ width: "100%", marginTop: 4 }}
                  placeholder="Document title"
                />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                Type
                <select
                  value={createForm.type}
                  onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  <option value="terms">Terms of Service</option>
                  <option value="privacy">Privacy Policy</option>
                  <option value="aup">Acceptable Use Policy</option>
                  <option value="disclaimer">Disclaimer</option>
                  <option value="returns">Return Policy</option>
                  <option value="shipping">Shipping Policy</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                State Code (leave empty for global)
                <input
                  value={createForm.stateCode}
                  onChange={e => setCreateForm({ ...createForm, stateCode: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                  placeholder="e.g. CA, NY"
                />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                Version
                <input
                  value={createForm.version}
                  onChange={e => setCreateForm({ ...createForm, version: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                  placeholder="1.0"
                />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                Effective From
                <input
                  type="date"
                  value={createForm.effectiveFrom}
                  onChange={e => setCreateForm({ ...createForm, effectiveFrom: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                />
              </label>

              {createError && (
                <div style={{ color: "#b91c1c", marginBottom: 12 }}>{createError}</div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

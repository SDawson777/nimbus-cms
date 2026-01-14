import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "../lib/adminContext";
import { apiFetch, apiJson } from "../lib/api";
import { safeJson } from "../lib/safeJson";
import { t } from "../lib/i18n";

export default function Personalization() {
  const { capabilities } = useAdmin();
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState(null);
  const [simCtx, setSimCtx] = useState({
    preference: "",
    location: "",
    timeOfDay: "",
    lastPurchaseDaysAgo: "",
  });
  const [result, setResult] = useState(null);
  const [simulateError, setSimulateError] = useState(null);
  const [simulateLoading, setSimulateLoading] = useState(false);

  // Create rule modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    enabled: true,
    conditionKey: "",
    conditionOperator: "eq",
    conditionValue: "",
    actionTargetType: "article",
    actionTargetSlug: "",
    actionPriorityBoost: 10,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const canManage = !!capabilities?.canManagePersonalization;
  const canView = !!capabilities?.canViewPersonalization;

  const loadRules = useCallback(async (signal) => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const { ok, data, response, aborted } = await apiJson(
        "/api/admin/personalization/rules",
        { signal },
        [],
      );
      if (aborted || signal?.aborted) return;
      if (!ok) {
        const text = response ? await response.text().catch(() => "") : "";
        throw new Error(text || "Failed to load rules");
      }
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("load rules failed", err);
      setRules([]);
      setRulesError(err?.message || "Failed to load rules");
    } finally {
      if (!signal?.aborted) setRulesLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRules(controller.signal);
    return () => controller.abort();
  }, [loadRules]);

  const hasRules = useMemo(
    () => Array.isArray(rules) && rules.length > 0,
    [rules],
  );

  async function simulate() {
    setSimulateError(null);
    setResult(null);
    setSimulateLoading(true);
    try {
      const body = {
        context: {
          ...simCtx,
          lastPurchaseDaysAgo: Number(simCtx.lastPurchaseDaysAgo || 0),
        },
        contentType: "article",
      };
      const res = await apiFetch("/personalization/apply", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Simulation failed");
      }
      const j = await safeJson(res, {});
      setResult(j);
    } catch (err) {
      console.error("simulate failed", err);
      setSimulateError(err?.message || "Simulation failed");
    } finally {
      setSimulateLoading(false);
    }
  }

  async function handleCreateRule(e) {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      const body = {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        enabled: createForm.enabled,
        conditions: createForm.conditionKey ? [{
          key: createForm.conditionKey,
          operator: createForm.conditionOperator,
          value: createForm.conditionValue,
        }] : [],
        actions: createForm.actionTargetSlug ? [{
          targetType: createForm.actionTargetType,
          targetSlugOrKey: createForm.actionTargetSlug,
          priorityBoost: Number(createForm.actionPriorityBoost) || 10,
        }] : [],
      };
      const res = await apiFetch("/api/admin/personalization/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create rule");
      }
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        description: "",
        enabled: true,
        conditionKey: "",
        conditionOperator: "eq",
        conditionValue: "",
        actionTargetType: "article",
        actionTargetSlug: "",
        actionPriorityBoost: 10,
      });
      loadRules();
    } catch (err) {
      console.error("create rule failed", err);
      setCreateError(err?.message || "Failed to create rule");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleToggleRule(ruleId, currentEnabled) {
    setTogglingId(ruleId);
    try {
      const res = await apiFetch(`/api/admin/personalization/rules/${ruleId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to toggle rule");
      }
      // Update local state
      setRules(prev => prev.map(r => r._id === ruleId ? { ...r, enabled: !currentEnabled } : r));
    } catch (err) {
      console.error("toggle rule failed", err);
      alert("Failed to toggle rule: " + (err?.message || "Unknown error"));
    } finally {
      setTogglingId(null);
    }
  }

  const studioBaseUrl = (import.meta.env.VITE_STUDIO_URL || "/studio").replace(
    /\/$/,
    "",
  );
  // Preview secrets are server-side only; do not include them in client bundles.
  const studioPreviewSuffix = "";

  return (
    <div style={{ padding: 20 }}>
      <h1>{t('personalization_title')}</h1>
      {!canView && (
        <div
          style={{
            padding: 12,
            background: "#fee2e2",
            color: "#b91c1c",
            marginTop: 12,
          }}
        >
          You do not have permission to view personalization rules. Contact an
          Org or Brand Admin.
        </div>
      )}

      {canView && (
        <div
          style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}
        >
          <div style={{ flex: 1, minWidth: 320 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ margin: 0 }}>Rules</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {canManage && (
                  <button type="button" onClick={() => setShowCreateModal(true)}>
                    Create Rule
                  </button>
                )}
                <button type="button" onClick={loadRules} disabled={rulesLoading}>
                  {rulesLoading ? t('refreshing') : t('reload')}
                </button>
              </div>
            </div>
            {rulesError && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  background: "#fee2e2",
                  color: "#b91c1c",
                }}
              >
                Failed to load rules: {rulesError}
              </div>
            )}
            {!rulesError && !hasRules && !rulesLoading && (
              <div style={{ marginTop: 8 }}>
                No rules configured for this scope.
              </div>
            )}
            {rulesLoading && <div style={{ marginTop: 8 }}>{t('loading_rules')}</div>}
            {hasRules && (
              <ul style={{ marginTop: 12 }}>
                {rules.map((r) => (
                  <li key={r._id} style={{ marginBottom: 12 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <strong>{r.name}</strong>
                      {canManage && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!r.enabled}
                          onClick={() => handleToggleRule(r._id, r.enabled)}
                          disabled={togglingId === r._id}
                          style={{
                            padding: "2px 8px",
                            fontSize: 11,
                            background: r.enabled ? "#22c55e" : "#e5e7eb",
                            color: r.enabled ? "#fff" : "#374151",
                            border: "none",
                            borderRadius: 12,
                            cursor: togglingId === r._id ? "wait" : "pointer",
                          }}
                        >
                          {r.enabled ? "Enabled" : "Disabled"}
                        </button>
                      )}
                      {!canManage && !r.enabled && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#b45309",
                            background: "#fef3c7",
                            padding: "0 6px",
                            borderRadius: 999,
                          }}
                        >
                          Disabled
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <small style={{ display: "block" }}>
                        {r.description}
                      </small>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <strong>Conditions:</strong>{" "}
                      {(r.conditions || [])
                        .map((c) => `${c.key} ${c.operator} ${c.value}`)
                        .join("; ") || "—"}
                    </div>
                    <div>
                      <strong>Actions:</strong>{" "}
                      {(r.actions || [])
                        .map(
                          (a) =>
                            `${a.targetType}:${a.targetSlugOrKey} (+${a.priorityBoost || 0})${a.channel ? " @" + a.channel : ""}`,
                        )
                        .join("; ") || "—"}
                    </div>
                    <div>
                      <a href={`${studioBaseUrl}/desk/personalizationRule;${r._id}`} target="_blank" rel="noreferrer">
                        Open in Studio
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ width: 360, flex: "0 0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ margin: 0 }}>Simulator</h2>
              {!canManage && (
                <span style={{ fontSize: 12, color: "#b91c1c" }}>
                  {t('editor_role_required')}
                </span>
              )}
            </div>
            {["preference", "location", "timeOfDay", "lastPurchaseDaysAgo"].map(
              (field) => (
                <label key={field} style={{ display: "block", marginTop: 8 }}>
                  {field === "lastPurchaseDaysAgo"
                    ? "Last purchase days ago"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                  <br />
                  <input
                    value={simCtx[field]}
                    onChange={(e) =>
                      setSimCtx({ ...simCtx, [field]: e.target.value })
                    }
                    disabled={!canManage}
                    style={{ width: "100%" }}
                  />
                </label>
              ),
            )}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={simulate}
                disabled={!canManage || simulateLoading}
              >
                {simulateLoading ? t('running') : t('simulate')}
              </button>
            </div>
            {simulateError && (
              <div style={{ marginTop: 8, color: "#b91c1c" }}>
                {simulateError}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <h3>Result</h3>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {result ? JSON.stringify(result, null, 2) : "Run simulation"}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
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
            width: 500,
            maxHeight: "80vh",
            overflow: "auto",
          }}>
            <h2 style={{ marginTop: 0 }}>Create Rule</h2>
            <form onSubmit={handleCreateRule}>
              <label style={{ display: "block", marginBottom: 12 }}>
                Name *
                <input
                  name="name"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  style={{ width: "100%", marginTop: 4 }}
                  placeholder="Rule name"
                />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                Description
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{ width: "100%", marginTop: 4 }}
                  rows={2}
                  placeholder="Optional description"
                />
              </label>
              <label style={{ display: "block", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={createForm.enabled}
                  onChange={e => setCreateForm({ ...createForm, enabled: e.target.checked })}
                />
                {" "}Enabled
              </label>

              <h3 style={{ marginBottom: 8 }}>Condition (optional)</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  placeholder="Key (e.g. preference)"
                  value={createForm.conditionKey}
                  onChange={e => setCreateForm({ ...createForm, conditionKey: e.target.value })}
                  style={{ flex: 1 }}
                />
                <select
                  value={createForm.conditionOperator}
                  onChange={e => setCreateForm({ ...createForm, conditionOperator: e.target.value })}
                >
                  <option value="eq">equals</option>
                  <option value="gt">greater than</option>
                  <option value="lt">less than</option>
                  <option value="contains">contains</option>
                </select>
                <input
                  placeholder="Value"
                  value={createForm.conditionValue}
                  onChange={e => setCreateForm({ ...createForm, conditionValue: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>

              <h3 style={{ marginBottom: 8 }}>Action (optional)</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select
                  value={createForm.actionTargetType}
                  onChange={e => setCreateForm({ ...createForm, actionTargetType: e.target.value })}
                >
                  <option value="article">Article</option>
                  <option value="deal">Deal</option>
                  <option value="productCategory">Product Category</option>
                </select>
                <input
                  placeholder="Target slug"
                  value={createForm.actionTargetSlug}
                  onChange={e => setCreateForm({ ...createForm, actionTargetSlug: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Boost"
                  value={createForm.actionPriorityBoost}
                  onChange={e => setCreateForm({ ...createForm, actionPriorityBoost: e.target.value })}
                  style={{ width: 80 }}
                />
              </div>

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

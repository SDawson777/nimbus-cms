import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";

const defaultBehavior = {
  tenantId: "",
  featureFlags: {
    aiConcierge: true,
    journaling: true,
    loyalty: false,
    previewMode: false,
  },
  notifications: {
    delivery: ["email", "in-app"],
    frequency: "hourly",
    triggers: ["revenue-spike"],
  },
  personalization: {
    strategy: "hybrid",
    weightPurchaseHistory: 0.5,
    weightBrowsing: 0.3,
    weightContext: 0.2,
  },
  legal: { reacceptOnUpdate: true, ageGate: 21 },
  caching: { aggressive: false, previewMode: false },
};

export default function BehaviorPage() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [behavior, setBehavior] = useState(defaultBehavior);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const fetchTenants = async () => {
    const res = await apiJson("/api/admin/control/tenants");
    if (res.ok) {
      setTenants(res.data.items || []);
      if (!selectedTenant && res.data.items?.length) {
        const first = res.data.items[0].id;
        setSelectedTenant(first);
        setBehavior((b) => ({ ...b, tenantId: first }));
      }
    }
  };

  const fetchBehavior = async (tenantId) => {
    setLoading(true);
    const res = await apiJson(`/api/admin/control/behavior/${tenantId}`);
    if (res.ok) setBehavior(res.data);
    else setBehavior({ ...defaultBehavior, tenantId });
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) fetchBehavior(selectedTenant);
  }, [selectedTenant]);

  const toggleFlag = (key) => {
    setBehavior((b) => ({
      ...b,
      featureFlags: { ...b.featureFlags, [key]: !b.featureFlags[key] },
    }));
  };

  const update = (path, value) => {
    setBehavior((b) => {
      const next = { ...b };
      let target = next;
      for (let i = 0; i < path.length - 1; i += 1) {
        target = target[path[i]];
      }
      target[path[path.length - 1]] = value;
      return { ...next };
    });
  };

  const save = async () => {
    if (!selectedTenant) return;
    setToast("");
    setError("");
    const res = await apiJson(`/api/admin/control/behavior/${selectedTenant}`, {
      method: "POST",
      body: JSON.stringify({ ...behavior, tenantId: selectedTenant }),
    });
    if (res.ok) {
      setToast("Behavior saved");
      fetchBehavior(selectedTenant);
    } else {
      setError(res.data?.error || "Save failed");
    }
  };

  return (
    <div className="page">
      <h2>System behavior & feature flags</h2>
      <p className="muted">
        Control AI concierge, journaling, notifications, personalization, and
        compliance per tenant.
      </p>
      <div className="card">
        <label>
          Tenant
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {loading ? (
          <div>Loading behavior…</div>
        ) : (
          <div className="behavior-grid">
            <section>
              <h3>Feature flags</h3>
              <div className="chip-row">
                {Object.keys(behavior.featureFlags).map((flag) => (
                  <button
                    key={flag}
                    type="button"
                    className={`chip ${behavior.featureFlags[flag] ? "chip--on" : ""}`}
                    onClick={() => toggleFlag(flag)}
                  >
                    {flag}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>Notifications</h3>
              <label>
                Frequency
                <select
                  value={behavior.notifications.frequency}
                  onChange={(e) =>
                    update(["notifications", "frequency"], e.target.value)
                  }
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily digest</option>
                </select>
              </label>
              <label>
                Delivery methods (comma separated)
                <input
                  value={behavior.notifications.delivery.join(", ")}
                  onChange={(e) =>
                    update(
                      ["notifications", "delivery"],
                      e.target.value.split(",").map((v) => v.trim()),
                    )
                  }
                />
              </label>
              <label>
                Triggers (comma separated)
                <input
                  value={behavior.notifications.triggers.join(", ")}
                  onChange={(e) =>
                    update(
                      ["notifications", "triggers"],
                      e.target.value.split(",").map((v) => v.trim()),
                    )
                  }
                />
              </label>
            </section>
            <section>
              <h3>Personalization</h3>
              <label>
                Strategy
                <select
                  value={behavior.personalization.strategy}
                  onChange={(e) =>
                    update(["personalization", "strategy"], e.target.value)
                  }
                >
                  <option value="deals-first">Deals first</option>
                  <option value="education-first">Education first</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Purchase weight
                  <input
                    type="number"
                    step="0.1"
                    value={behavior.personalization.weightPurchaseHistory}
                    onChange={(e) =>
                      update(
                        ["personalization", "weightPurchaseHistory"],
                        Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  Browsing weight
                  <input
                    type="number"
                    step="0.1"
                    value={behavior.personalization.weightBrowsing}
                    onChange={(e) =>
                      update(
                        ["personalization", "weightBrowsing"],
                        Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  Context weight
                  <input
                    type="number"
                    step="0.1"
                    value={behavior.personalization.weightContext}
                    onChange={(e) =>
                      update(
                        ["personalization", "weightContext"],
                        Number(e.target.value),
                      )
                    }
                  />
                </label>
              </div>
            </section>
            <section>
              <h3>Legal & caching</h3>
              <label className="inline">
                <input
                  type="checkbox"
                  checked={behavior.legal.reacceptOnUpdate}
                  onChange={(e) =>
                    update(["legal", "reacceptOnUpdate"], e.target.checked)
                  }
                />
                Require re-accept on legal change
              </label>
              <label>
                Age gate
                <input
                  type="number"
                  value={behavior.legal.ageGate}
                  onChange={(e) =>
                    update(["legal", "ageGate"], Number(e.target.value))
                  }
                />
              </label>
              <label className="inline">
                <input
                  type="checkbox"
                  checked={behavior.caching.aggressive}
                  onChange={(e) =>
                    update(["caching", "aggressive"], e.target.checked)
                  }
                />
                Aggressive caching
              </label>
              <label className="inline">
                <input
                  type="checkbox"
                  checked={behavior.caching.previewMode}
                  onChange={(e) =>
                    update(["caching", "previewMode"], e.target.checked)
                  }
                />
                Preview mode
              </label>
            </section>
          </div>
        )}
        <button
          className="btn primary"
          onClick={save}
          disabled={!selectedTenant}
        >
          Save behavior
        </button>
        <div className="toolbar" style={{ marginTop: "0.5rem" }}>
          {toast && <span className="pill success">{toast}</span>}
          {error && <span className="pill danger">{error}</span>}
        </div>
      </div>
    </div>
  );
}

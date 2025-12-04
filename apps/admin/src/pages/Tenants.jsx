import React, { useEffect, useMemo, useState } from "react";
import { apiJson } from "../lib/api";

function TenantForm({ onSave, editing, onReset }) {
  const [form, setForm] = useState({
    id: "",
    version: undefined,
    name: "",
    slug: "",
    domains: "",
    dataset: "",
    status: "active",
    featureFlags: { aiConcierge: true, journaling: false, loyalty: false },
  });

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        domains: (editing.domains || []).join(", "),
      });
    }
  }, [editing]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleFlag = (key) => {
    setForm((f) => ({
      ...f,
      featureFlags: { ...f.featureFlags, [key]: !f.featureFlags[key] },
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      version: editing?.version,
      domains: form.domains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    };
    const res = await onSave(payload);
    if (res) {
      setForm({
        id: "",
        version: undefined,
        name: "",
        slug: "",
        domains: "",
        dataset: "",
        status: "active",
        featureFlags: { aiConcierge: true, journaling: false, loyalty: false },
      });
      onReset?.();
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-header">
        <div>
          <h3>{editing ? "Update tenant" : "Create tenant"}</h3>
          {editing && <p className="muted">Editing {editing.name}</p>}
        </div>
        {editing && (
          <button type="button" className="btn" onClick={onReset}>
            Cancel
          </button>
        )}
      </div>
      <div className="form-grid">
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </label>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            required
          />
        </label>
        <label>
          Dataset
          <input
            value={form.dataset}
            onChange={(e) => update("dataset", e.target.value)}
            required
          />
        </label>
        <label>
          Domains (comma separated)
          <input
            value={form.domains}
            onChange={(e) => update("domains", e.target.value)}
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
      </div>
      <div className="chip-row">
        {Object.keys(form.featureFlags).map((flag) => (
          <button
            key={flag}
            type="button"
            className={`chip ${form.featureFlags[flag] ? "chip--on" : ""}`}
            onClick={() => toggleFlag(flag)}
          >
            {flag} {form.featureFlags[flag] ? "ON" : "OFF"}
          </button>
        ))}
      </div>
      <button className="btn primary" type="submit">
        Save tenant
      </button>
    </form>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTenant, setActiveTenant] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchTenants = async () => {
    setLoading(true);
    const res = await apiJson("/api/admin/control/tenants");
    if (res.ok) setTenants(res.data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const saveTenant = async (payload) => {
    setToast("");
    setError("");
    const res = await apiJson("/api/admin/control/tenants", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchTenants();
      setToast("Tenant saved");
      return true;
    }
    setError(res.data?.error || "Failed to save tenant");
    return false;
  };

  const deleteTenantApi = async (id) => {
    setToast("");
    setError("");
    const res = await apiJson(`/api/admin/control/tenants/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchTenants();
      setToast("Tenant removed");
      if (activeTenant?.id === id) setActiveTenant(null);
    } else {
      setError(res.data?.error || "Delete failed");
    }
  };

  const filteredTenants = useMemo(() => {
    if (!search) return tenants;
    const term = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term) ||
        (t.domains || []).some((d) => d.toLowerCase().includes(term)),
    );
  }, [search, tenants]);

  return (
    <div className="page">
      <h2>Tenants</h2>
      <p className="muted">
        Configure operators with dataset mappings, domains, and feature flags.
      </p>
      <TenantForm
        onSave={saveTenant}
        editing={activeTenant}
        onReset={() => setActiveTenant(null)}
      />
      <div className="toolbar">
        <input
          placeholder="Search tenants"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {toast && <span className="pill success">{toast}</span>}
        {error && <span className="pill danger">{error}</span>}
      </div>
      <div className="card">
        <h3>Existing tenants</h3>
        {loading && <div>Loading…</div>}
        {!loading && filteredTenants.length === 0 && (
          <div>No tenants found.</div>
        )}
        <div className="table-grid">
          {filteredTenants.map((t) => (
            <div key={t.id} className="table-row">
              <div>
                <div className="strong">{t.name}</div>
                <div className="muted">{t.slug}</div>
              </div>
              <div>
                <span className="pill">{t.status}</span>
              </div>
              <div>
                <div className="muted">Dataset: {t.dataset}</div>
                <div className="muted">
                  Domains: {(t.domains || []).join(", ")}
                </div>
              </div>
              <div className="table-actions">
                <button className="btn" onClick={() => setActiveTenant(t)}>
                  Edit
                </button>
                <button
                  className="btn danger"
                  onClick={() =>
                    window.confirm("Delete tenant and related stores?") &&
                    deleteTenantApi(t.id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

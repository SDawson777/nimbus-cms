import React, { useEffect, useMemo, useState } from "react";
import { apiJson } from "../lib/api";

function StoreForm({ tenants, onSave, editing, onReset }) {
  const [form, setForm] = useState({
    id: "",
    version: undefined,
    tenantId: "",
    name: "",
    slug: "",
    address: "",
    timezone: "",
    region: "",
    live: true,
    delivery: true,
    pickup: true,
    pos: { provider: "", endpoint: "" },
    hours: "",
  });

  useEffect(() => {
    if (!form.tenantId && tenants.length > 0) {
      setForm((f) => ({ ...f, tenantId: tenants[0].id }));
    }
  }, [tenants]);

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing,
        tenantId: editing.tenantId,
        pos: editing.pos || { provider: "", endpoint: "" },
      });
    }
  }, [editing]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const updatePos = (key, value) =>
    setForm((f) => ({ ...f, pos: { ...f.pos, [key]: value } }));

  const submit = async (e) => {
    e.preventDefault();
    const res = await onSave(form);
    if (res) {
      setForm((f) => ({
        ...f,
        id: "",
        version: undefined,
        name: "",
        slug: "",
        address: "",
        pos: { provider: "", endpoint: "" },
      }));
      onReset?.();
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <div className="card-header">
        <div>
          <h3>{editing ? "Update store" : "Create store"}</h3>
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
          Tenant
          <select
            value={form.tenantId}
            onChange={(e) => update("tenantId", e.target.value)}
            required
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
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
          Address
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </label>
        <label>
          Timezone
          <input
            value={form.timezone}
            onChange={(e) => update("timezone", e.target.value)}
          />
        </label>
        <label>
          Region
          <input
            value={form.region}
            onChange={(e) => update("region", e.target.value)}
          />
        </label>
        <label>
          Hours
          <input
            value={form.hours}
            onChange={(e) => update("hours", e.target.value)}
          />
        </label>
      </div>
      <div className="chip-row">
        <label className="inline">
          <input
            type="checkbox"
            checked={form.live}
            onChange={(e) => update("live", e.target.checked)}
          />{" "}
          Live
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={form.delivery}
            onChange={(e) => update("delivery", e.target.checked)}
          />{" "}
          Delivery
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={form.pickup}
            onChange={(e) => update("pickup", e.target.checked)}
          />{" "}
          Pickup
        </label>
      </div>
      <div className="form-grid">
        <label>
          POS Provider
          <input
            value={form.pos.provider}
            onChange={(e) => updatePos("provider", e.target.value)}
          />
        </label>
        <label>
          POS Endpoint
          <input
            value={form.pos.endpoint}
            onChange={(e) => updatePos("endpoint", e.target.value)}
          />
        </label>
      </div>
      <button className="btn primary" type="submit">
        Save store
      </button>
    </form>
  );
}

export default function StoresPage() {
  const [tenants, setTenants] = useState([]);
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchTenants = async () => {
    const res = await apiJson("/api/admin/control/tenants");
    if (res.ok) setTenants(res.data.items || []);
  };

  const fetchStores = async (tenantId) => {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const res = await apiJson(`/api/admin/control/stores${qs}`);
    if (res.ok) setStores(res.data.items || []);
  };

  useEffect(() => {
    fetchTenants().then(() => fetchStores());
  }, []);

  const saveStore = async (payload) => {
    setToast("");
    setError("");
    const res = await apiJson("/api/admin/control/stores", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchStores(payload.tenantId);
      setToast("Store saved");
      return true;
    }
    setError(res.data?.error || "Failed to save store");
    return false;
  };

  const deleteStoreApi = async (id) => {
    setToast("");
    setError("");
    const res = await apiJson(`/api/admin/control/stores/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchStores();
      setToast("Store removed");
      if (activeStore?.id === id) setActiveStore(null);
    } else {
      setError(res.data?.error || "Delete failed");
    }
  };

  const filteredStores = useMemo(() => {
    if (!search) return stores;
    const term = search.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        (s.region || "").toLowerCase().includes(term) ||
        (s.pos?.provider || "").toLowerCase().includes(term),
    );
  }, [search, stores]);

  return (
    <div className="page">
      <h2>Stores</h2>
      <p className="muted">
        Manage store metadata, operating modes, and POS hooks per tenant.
      </p>
      <StoreForm
        tenants={tenants}
        onSave={saveStore}
        editing={activeStore}
        onReset={() => setActiveStore(null)}
      />
      <div className="toolbar">
        <input
          placeholder="Search stores"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {toast && <span className="pill success">{toast}</span>}
        {error && <span className="pill danger">{error}</span>}
      </div>
      <div className="card">
        <h3>Existing stores</h3>
        <div className="table-grid">
          {filteredStores.map((s) => (
            <div key={s.id} className="table-row">
              <div>
                <div className="strong">{s.name}</div>
                <div className="muted">{s.slug}</div>
                <div className="muted">Tenant: {s.tenantId}</div>
              </div>
              <div>
                <span className="pill">{s.live ? "Live" : "Offline"}</span>
                <div className="muted">
                  Modes: {s.delivery ? "Delivery " : ""}
                  {s.pickup ? "Pickup" : ""}
                </div>
              </div>
              <div className="muted">POS: {s.pos?.provider || "n/a"}</div>
              <div className="table-actions">
                <button className="btn" onClick={() => setActiveStore(s)}>
                  Edit
                </button>
                <button
                  className="btn danger"
                  onClick={() =>
                    window.confirm("Delete store?") && deleteStoreApi(s.id)
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

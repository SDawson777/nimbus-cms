import React, { useEffect, useMemo, useState } from "react";
import { apiJson } from "../lib/api";
import Select from "../design-system/Select";
import Input from "../design-system/Input";
import Button from "../design-system/Button";

const ORDER_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "PENDING" },
  { value: "PAID", label: "PAID" },
  { value: "FULFILLED", label: "FULFILLED" },
  { value: "CANCELLED", label: "CANCELLED" },
  { value: "REFUNDED", label: "REFUNDED" },
];

function formatMoney(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function buildQuery({ status, storeId, from, to }) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (storeId) params.set("storeId", storeId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  // simple cache-bust for rapid filter changes
  params.set("cacheBust", String(Date.now()));
  return params.toString();
}

export default function Orders() {
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState("");
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const storeOptions = useMemo(() => {
    const opts = [{ value: "", label: "All stores" }];
    for (const s of stores) {
      opts.push({
        value: s.id,
        label: s.name ? `${s.name}${s.slug ? ` (${s.slug})` : ""}` : s.id,
      });
    }
    return opts;
  }, [stores]);

  async function loadStores() {
    const res = await apiJson("/api/admin/orders/stores");
    if (!res.ok) throw new Error(res.error || "Failed to load stores");
    const list = Array.isArray(res.data?.stores) ? res.data.stores : [];
    setStores(list);
  }

  async function loadOrders() {
    setLoading(true);
    setError(null);
    const qs = buildQuery({ status, storeId, from, to });
    const res = await apiJson(`/api/admin/orders?${qs}`, {}, { orders: [] });
    if (!res.ok) {
      throw new Error(res.error || "Failed to load orders");
    }
    const list = Array.isArray(res.data?.orders) ? res.data.orders : [];
    setOrders(list);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadStores();
      } catch (e) {
        if (!mounted) return;
        setError(String(e?.message || e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadOrders();
      } catch (e) {
        if (!mounted) return;
        setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, storeId, from, to]);

  async function openOrder(orderId) {
    setSelectedOrderId(orderId);
    setDrawerOpen(true);
    setOrderDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    const res = await apiJson(`/api/admin/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) {
      setDetailError(res.error || "Failed to load order detail");
      setDetailLoading(false);
      return;
    }

    setOrderDetail(res.data?.order || null);
    setDetailLoading(false);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedOrderId(null);
  }

  const sourceOfTruthNote =
    orderDetail?.sourceOfTruth ||
    "Source of truth: Orders are read-only here and reflect the system-of-record (ingestion/POS/DB).";

  return (
    <div className="card" style={{ maxWidth: 1100, margin: "1rem auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Orders</h2>
        <Button
          variant="secondary"
          onClick={() => {
            setStatus("");
            setStoreId("");
            setFrom("");
            setTo("");
          }}
        >
          Clear filters
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={ORDER_STATUSES}
        />
        <Select
          label="Store"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          options={storeOptions}
        />
        <Input
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {error && (
        <div style={{ marginTop: 12 }} className="alert-error">
          {error}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        {loading ? (
          <p>Loading…</p>
        ) : orders.length === 0 ? (
          <p style={{ margin: 0 }}>No orders found for the selected filters.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Created</th>
                <th>Status</th>
                <th>Store</th>
                <th>User</th>
                <th>Total</th>
                <th style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{o.status || "—"}</td>
                  <td>{o.store?.name || o.store?.slug || o.storeId || "—"}</td>
                  <td>{o.user?.email || o.userId || "—"}</td>
                  <td>{formatMoney(o.total)}</td>
                  <td>
                    <button
                      className="ghost"
                      onClick={() => openOrder(o.id)}
                      aria-label={`Open order ${o.id}`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order details"
          onClick={closeDrawer}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 1200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(560px, 92vw)",
              background: "#fff",
              borderLeft: "1px solid #E5E7EB",
              padding: 16,
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Order</h3>
              <Button variant="ghost" onClick={closeDrawer}>
                Close
              </Button>
            </div>

            {detailLoading ? (
              <p style={{ marginTop: 12 }}>Loading…</p>
            ) : detailError ? (
              <div style={{ marginTop: 12 }} className="alert-error">
                {detailError}
              </div>
            ) : !orderDetail ? (
              <p style={{ marginTop: 12 }}>No detail available.</p>
            ) : (
              <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Order ID</div>
                  <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                    {orderDetail.id}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>Created</div>
                    <div>{formatDateTime(orderDetail.createdAt)}</div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>Updated</div>
                    <div>{formatDateTime(orderDetail.updatedAt)}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>Store</div>
                    <div>
                      {orderDetail.store?.name || orderDetail.store?.slug || orderDetail.storeId || "—"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>User</div>
                    <div>
                      {orderDetail.user?.email || orderDetail.userId || "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <Select
                      label="Status"
                      value={orderDetail.status || ""}
                      onChange={() => {}}
                      disabled
                      options={ORDER_STATUSES.filter((o) => o.value)}
                    />
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                      {orderDetail.canUpdateStatus
                        ? "Status updates are supported."
                        : "Read-only: status updates are not supported in Admin yet."}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>Total</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {formatMoney(orderDetail.total)}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ margin: 0 }}>
                  <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                    Source of truth
                  </div>
                  <div style={{ fontSize: 14 }}>{sourceOfTruthNote}</div>
                </div>

                <div>
                  <h4 style={{ marginTop: 0 }}>Items</h4>
                  {!orderDetail.items || orderDetail.items.length === 0 ? (
                    <p style={{ margin: 0 }}>No items recorded.</p>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th>Product</th>
                          <th>Variant</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetail.items.map((it) => (
                          <tr key={it.id}>
                            <td>{it.product?.name || it.productId || "—"}</td>
                            <td>{it.variant?.name || it.variantId || "—"}</td>
                            <td>{it.quantity ?? "—"}</td>
                            <td>{formatMoney(it.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="secondary" onClick={closeDrawer}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* keep state stable for accessibility */}
      <div style={{ display: "none" }} aria-hidden="true">
        {selectedOrderId}
      </div>
    </div>
  );
}

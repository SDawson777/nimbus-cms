import React, { useEffect, useState } from "react";

export default function EngagementMetrics() {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/nimbus/analytics/overview");
        const json = await res.json().catch(() => ({}));
        setMetrics(json || {});
      } catch (e) {
        setMetrics({ error: String(e) });
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <h3>Engagement Metrics</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 8,
        }}
      >
        <div>
          <strong>Active Users</strong>
          <div>{metrics.activeUsers ?? "—"}</div>
        </div>
        <div>
          <strong>Sessions</strong>
          <div>{metrics.sessions ?? "—"}</div>
        </div>
        <div>
          <strong>Orders Today</strong>
          <div>{metrics.ordersToday ?? "—"}</div>
        </div>
        <div>
          <strong>Inventory Alerts</strong>
          <div>{metrics.inventoryAlerts ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

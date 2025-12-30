import React, { useEffect, useState, useCallback } from "react";
import { useAdmin } from "../lib/adminContext";
import { apiFetch, apiJson } from "../lib/api";

export default function Analytics() {
  const [metrics, setMetrics] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { capabilities } = useAdmin();

  const loadMetrics = useCallback(async (signal) => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const { ok, data, response, aborted } = await apiJson(
        "/api/admin/analytics/content-metrics",
        { signal },
        [],
      );
      if (aborted || signal?.aborted) return;
      if (!ok) {
        const text = response
          ? await response.text().catch(() => "Failed to load metrics")
          : "";
        throw new Error(text || "Failed to load metrics");
      }
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMetricsError(err?.message || "Unable to load metrics");
    } finally {
      if (!signal?.aborted) setMetricsLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async (signal) => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const { ok, data, response, aborted } = await apiJson(
        "/api/admin/analytics/summary",
        { signal },
        null,
      );
      if (aborted || signal?.aborted) return;
      if (!ok) {
        const text = response
          ? await response.text().catch(() => "Failed to load summary")
          : "";
        throw new Error(text || "Failed to load summary");
      }
      setSummary(data);
    } catch (err) {
      console.error(err);
      setSummaryError(err?.message || "Unable to load summary");
      setSummary(null);
    } finally {
      if (!signal?.aborted) setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadMetrics(controller.signal);
    loadSummary(controller.signal);
    return () => controller.abort();
  }, [loadMetrics, loadSummary]);

  const handleRefresh = useCallback(async () => {
    if (!capabilities?.canRefreshAnalytics) return;
    setRefreshing(true);
    try {
      const res = await apiFetch("/api/admin/analytics/summary", {
        method: "POST",
        body: JSON.stringify({ query: {} }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Refresh failed");
        throw new Error(text || "Refresh failed");
      }
      await loadSummary();
      await loadMetrics();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to refresh analytics");
    } finally {
      setRefreshing(false);
    }
  }, [capabilities?.canRefreshAnalytics, loadMetrics, loadSummary]);

  const lastRefreshedLabel = (() => {
    if (!summary || !summary.lastRefreshedAt) return "Not available";
    try {
      const ts = new Date(summary.lastRefreshedAt);
      return `${ts.toLocaleString()}${summary.stale ? " (stale)" : ""}`;
    } catch (_err) {
      return `${summary.lastRefreshedAt}${summary.stale ? " (stale)" : ""}`;
    }
  })();

  return (
    <div style={{ padding: 20 }}>
      <h1>Analytics</h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
          <div>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              color: "#6b7280",
            }}
          >
            {t('last_refresh')}
          </div>
          <strong>{summaryLoading ? t('loading') : lastRefreshedLabel}</strong>
          {summaryError && (
            <div style={{ color: "#b91c1c", fontSize: 12 }}>
              Summary error: {summaryError}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {summary?.stale && !summaryLoading && (
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#fef3c7",
                color: "#92400e",
              }}
            >
              Cached data may be stale
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={!capabilities?.canRefreshAnalytics || refreshing}
            title={
              capabilities?.canRefreshAnalytics
                ? t('refresh_analytics_cache')
                : t('insufficient_role')
            }
          >
            {refreshing ? t('refreshing') : t('refresh_analytics')}
          </button>
        </div>
      </div>

      <h2>Top content by views</h2>
      {metricsLoading ? (
        <div>Loading metrics…</div>
      ) : metricsError ? (
        <div style={{ color: "#b91c1c" }}>
          Failed to load metrics: {metricsError}
        </div>
      ) : metrics.length === 0 ? (
        <div style={{ fontStyle: "italic" }}>
          No analytics data available for this scope.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Content</th>
              <th>Type</th>
              <th>Views</th>
              <th>Clicks</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m._id || `${m.contentType}-${m.contentSlug}`}>
                <td>{m.contentSlug}</td>
                <td>{m.contentType}</td>
                <td>{m.views}</td>
                <td>{m.clickThroughs}</td>
                <td>{m.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

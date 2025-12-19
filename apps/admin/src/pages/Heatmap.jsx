import React, { useEffect, useState } from "react";
import Card from "../design-system/Card";
import Heatmap from "../components/Heatmap";
import { apiJson, apiBaseUrl } from "../lib/api";

const SAMPLE_STORES = [
  {
    storeSlug: "detroit-hq",
    longitude: -83.0458,
    latitude: 42.3314,
    engagement: 42,
    views: 980,
    clickThroughs: 240,
  },
  {
    storeSlug: "chicago-loop",
    longitude: -87.6298,
    latitude: 41.8781,
    engagement: 37,
    views: 860,
    clickThroughs: 210,
  },
  {
    storeSlug: "nyc-soho",
    longitude: -74.006,
    latitude: 40.7128,
    engagement: 55,
    views: 1120,
    clickThroughs: 310,
  },
];

export default function HeatmapPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (apiBaseUrl()) {
          const { ok, data, aborted } = await apiJson(
            "/api/admin/analytics/overview",
            { signal: controller.signal },
          );
          if (
            !aborted &&
            !controller.signal.aborted &&
            ok &&
            data?.storeEngagement
          ) {
            setStores(
              Array.isArray(data.storeEngagement) ? data.storeEngagement : [],
            );
            return;
          }
        }
        if (!controller.signal.aborted) setStores(SAMPLE_STORES);
      } catch (e) {
        if (!controller.signal.aborted) setStores(SAMPLE_STORES);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => {
      controller.abort();
    };
  }, []);

  // Mapbox client tokens are deprecated for production usage to avoid leaking
  // private credentials. The heatmap currently requires server-side Mapbox
  // integration (static imagery or proxy). See docs/BACKUP_RESTORE_TESTS.md
  // and ENVIRONMENT_VARIABLES.md for configuration guidance.
  const canRender = false; // intentionally disable client-side Mapbox rendering

  return (
    <div className="page-shell" style={{ padding: 16 }}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Locations</p>
          <h1>Heatmap</h1>
          <p className="subdued">
            Track multi-store engagement across the map. Token-gated for secure
            previews.
          </p>
        </div>
      </div>

      <Card>
        <p className="metric-subtle">
          The heatmap requires server-side Mapbox integration to avoid exposing
          private tokens to the browser. See documentation for steps to enable
          the server proxy or provide a sanitized public token.
        </p>
        {loading && <p className="metric-subtle">Loading stores…</p>}
      </Card>
    </div>
  );
}

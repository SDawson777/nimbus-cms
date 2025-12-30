import React, { useEffect, useState } from "react";
import { t } from '../lib/i18n';
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
  const [svgUrl, setSvgUrl] = useState(null);

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
          <p className="eyebrow">{t('locations')}</p>
          <h1>{t('heatmap_title')}</h1>
          <p className="subdued">{t('heatmap_description')}</p>
        </div>
      </div>

      <Card>
        <p className="metric-subtle">{t('heatmap_rendered_server')}</p>
        {stores.length > 0 && (
          <div style={{ marginTop: 12 }}>
              {svgUrl ? (
              <img src={svgUrl} alt="Heatmap" style={{ width: '100%', maxWidth: 1000 }} />
            ) : (
              <p className="metric-subtle">{t('heatmap_rendering_preview')}</p>
            )}
          </div>
        )}
        {loading && <p className="metric-subtle">{t('loading_stores')}</p>}
      </Card>
    </div>
  );
}

// Fetch server-rendered SVG when stores update
function useSvgForStores(stores, setSvgUrl) {
  useEffect(() => {
    if (!stores || stores.length === 0) return undefined;
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/v1/nimbus/heatmap/static', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stores, width: 1000, height: 400 }),
          signal: controller.signal,
          credentials: 'include',
        });
        if (!mounted) return;
        if (!res.ok) {
          setSvgUrl(null);
          return;
        }
        const text = await res.text();
        const blob = new Blob([text], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        setSvgUrl(url);
      } catch (e) {
        if (!mounted) return;
        setSvgUrl(null);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
      setSvgUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
    };
  }, [stores]);
}


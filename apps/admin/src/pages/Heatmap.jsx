import React, { useState } from 'react';
import StoreHeatmap from '../components/StoreHeatmap';
import StoreAnalyticsModal from '../components/StoreAnalyticsModal';

export default function HeatmapPage() {
  const [selectedStore, setSelectedStore] = useState(null);

  const handleStoreClick = (store) => {
    setSelectedStore(store);
  };

  const handleCloseModal = () => {
    setSelectedStore(null);
  };

  return (
    <div className="heatmap-page">
      <StoreHeatmap onStoreClick={handleStoreClick} />
      {selectedStore && (
        <StoreAnalyticsModal 
          store={selectedStore} 
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
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


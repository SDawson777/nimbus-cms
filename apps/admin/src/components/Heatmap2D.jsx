import React, { useMemo } from "react";

function project(lon, lat) {
  const x = (lon + 180) / 360;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

export default function Heatmap2D({ stores = [], token }) {
  const center = useMemo(() => {
    if (!stores.length) return { lon: -96, lat: 37, zoom: 3 };
    const lon =
      stores.reduce((sum, s) => sum + (s.longitude || 0), 0) / stores.length;
    const lat =
      stores.reduce((sum, s) => sum + (s.latitude || 0), 0) / stores.length;
    return { lon, lat, zoom: 3 };
  }, [stores]);

  const hasToken = Boolean(token);
  const bgUrl = hasToken
    ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${center.lon},${center.lat},${center.zoom}/900x420?access_token=${token}`
    : null;

  return (
    <div className="heatmap-card">
      <div
        className="heatmap-map"
        style={{
          backgroundImage: bgUrl
            ? `url(${bgUrl})`
            : "linear-gradient(135deg,#0b1224,#0f1a33)",
        }}
        aria-label="Store engagement heatmap"
      >
        {stores.map((s) => {
          const { x, y } = project(s.longitude || 0, s.latitude || 0);
          const intensity = Math.min(1, (s.engagement || s.views || 1) / 120);
          return (
            <span
              key={s.storeSlug}
              className="heatmap-dot"
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                boxShadow: `0 0 12px rgba(56,189,248,${0.5 + intensity})`,
                opacity: 0.7 + intensity * 0.3,
              }}
              title={`${s.storeSlug}: ${s.engagement ?? s.views ?? 0}`}
            />
          );
        })}
      </div>
    </div>
  );
}

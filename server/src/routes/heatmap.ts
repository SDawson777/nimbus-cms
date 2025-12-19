import express from "express";

const router = express.Router();

type Store = {
  storeSlug?: string;
  longitude: number;
  latitude: number;
  engagement?: number;
};

function generateSvg(stores: Store[], width = 1000, height = 400) {
  if (!stores || stores.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='100%' height='100%' fill='#0b1220'/><text x='50%' y='50%' fill='#fff' font-size='18' text-anchor='middle'>No data</text></svg>`;
  }

  // Compute bbox in lon/lat
  const lons = stores.map((s) => s.longitude);
  const lats = stores.map((s) => s.latitude);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Expand bbox slightly for padding
  const lonPad = (maxLon - minLon) * 0.12 || 0.5;
  const latPad = (maxLat - minLat) * 0.12 || 0.5;
  const lon0 = minLon - lonPad;
  const lon1 = maxLon + lonPad;
  const lat0 = minLat - latPad;
  const lat1 = maxLat + latPad;

  function project(lon: number, lat: number) {
    const x = ((lon - lon0) / (lon1 - lon0)) * width;
    // invert lat for y
    const y = ((lat1 - lat) / (lat1 - lat0)) * height;
    return { x, y };
  }

  // normalize engagement for radius
  const engagements = stores.map((s) => s.engagement ?? 1);
  const maxE = Math.max(...engagements, 1);

  // Build circles
  const circles = stores
    .map((s, i) => {
      const { x, y } = project(s.longitude, s.latitude);
      const engagement = s.engagement ?? 1;
      const r = Math.max(8, (engagement / maxE) * 48);
      // color gradient from blue -> cyan -> green
      const intensity = Math.min(1, engagement / maxE);
      const color = intensity > 0.7 ? '#10b981' : intensity > 0.4 ? '#38bdf8' : '#3b82f6';
      const opacity = 0.6 * (0.5 + intensity * 0.8);
      return `<circle cx='${x.toFixed(2)}' cy='${y.toFixed(2)}' r='${r.toFixed(2)}' fill='${color}' fill-opacity='${opacity}' />`;
    })
    .join('\n');

  // Compose SVG with a subtle blur filter for heat effect
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
  <defs>
    <filter id='blur' x='-50%' y='-50%' width='200%' height='200%'>
      <feGaussianBlur stdDeviation='12' result='b' />
      <feMerge>
        <feMergeNode in='b'/>
        <feMergeNode in='SourceGraphic'/>
      </feMerge>
    </filter>
  </defs>
  <rect width='100%' height='100%' fill='#0b1220' />
  <g filter='url(#blur)'>
    ${circles}
  </g>
  <g fill='#fff' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='12'>
    <!-- Labels -->
    ${stores
      .map((s) => {
        const p = project(s.longitude, s.latitude);
        const name = (s.storeSlug || '').replace(/</g, '&lt;');
        return `<text x='${(p.x + 6).toFixed(1)}' y='${(p.y - 6).toFixed(1)}'>${name}</text>`;
      })
      .join('\n')}
  </g>
</svg>`;

  return svg;
}

router.post("/static", express.json({ limit: "1mb" }), (req, res) => {
  try {
    const stores = Array.isArray(req.body?.stores) ? req.body.stores : [];
    const width = Number(req.body?.width) || 1000;
    const height = Number(req.body?.height) || 400;
    const svg = generateSvg(stores, width, height);
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.send(svg);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("heatmap static error", err);
    res.status(500).json({ error: "failed to render heatmap" });
  }
});

export default router;

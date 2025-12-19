import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import IORedis, { Redis } from "ioredis";

const router = express.Router();

type Store = {
  storeSlug?: string;
  longitude: number;
  latitude: number;
  engagement?: number;
};

// Simple in-memory cache with TTL and LRU-style eviction
const CACHE_MAX_ENTRIES = 200;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
type CacheEntry = { svg: string; expiresAt: number };
const svgCache = new Map<string, CacheEntry>();

// Redis client (optional)
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new IORedis(process.env.REDIS_URL);
  } catch (e) {
    // ignore and fall back to in-memory cache
    // eslint-disable-next-line no-console
    console.warn("Failed to initialize Redis client, falling back to in-memory cache", e);
    redisClient = null;
  }
}

async function setCacheAsync(key: string, svg: string) {
  if (redisClient) {
    try {
      await redisClient.set(key, svg, "PX", CACHE_TTL_MS);
      return;
    } catch (e) {
      // fallback to in-memory cache
      // eslint-disable-next-line no-console
      console.warn("Redis set failed; falling back to in-memory cache", e);
    }
  }

  if (svgCache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = svgCache.keys().next().value;
    if (firstKey) svgCache.delete(firstKey);
  }
  svgCache.set(key, { svg, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function getCacheAsync(key: string) {
  if (redisClient) {
    try {
      const v = await redisClient.get(key);
      if (v) return v;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Redis get failed; falling back to in-memory cache", e);
    }
  }

  const e = svgCache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    svgCache.delete(key);
    return null;
  }
  svgCache.delete(key);
  svgCache.set(key, e);
  return e.svg;
}

function generateSvg(stores: Store[], width = 1000, height = 400, lang = "en") {
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
// Rate limiter: allow a small number of requests per IP for this endpoint
const heatmapLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /static
 * Request body: { stores: Array<{storeSlug, longitude, latitude, engagement}>, width?, height?, lang? }
 */
router.post(
  "/static",
  heatmapLimiter,
  express.json({ limit: "1mb" }),
  async (req, res) => {
    try {
      const stores = Array.isArray(req.body?.stores) ? req.body.stores : [];
      const width = Number(req.body?.width) || 1000;
      const height = Number(req.body?.height) || 400;
      const lang = String(req.body?.lang || "en");

      // Basic validation
      if (!Array.isArray(stores) || stores.length === 0) {
        return res.status(400).json({ error: "stores must be a non-empty array" });
      }
      if (stores.length > 500) {
        return res.status(400).json({ error: "stores array too large (max 500)" });
      }
      for (const s of stores) {
        const lon = Number(s.longitude);
        const lat = Number(s.latitude);
        const engagement = s.engagement == null ? 1 : Number(s.engagement);
        if (Number.isNaN(lon) || Number.isNaN(lat)) {
          return res.status(400).json({ error: "invalid store coordinates" });
        }
        if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
          return res.status(400).json({ error: "store coordinates out of range" });
        }
        if (!Number.isFinite(engagement) || engagement < 0 || engagement > 1000000) {
          return res.status(400).json({ error: "invalid engagement value" });
        }
        if (s.storeSlug && String(s.storeSlug).length > 120) {
          return res.status(400).json({ error: "storeSlug too long" });
        }
      }

      // Build cache key from stores payload and dimensions
      const hash = crypto.createHash("sha256");
      hash.update(JSON.stringify({ stores, width, height, lang }));
      const key = hash.digest("hex");
      // Metrics: count request and cache hits
      try {
        // increment heatmap request counter (import lazily to avoid circular deps in tests)
        const { heatmapRequests, heatmapCacheHits } = await import("../metrics");
        heatmapRequests.inc();
        const cached = await getCacheAsync(key);
        if (cached) {
          heatmapCacheHits.inc();
          res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
          return res.send(cached);
        }
      } catch (e) {
        // metrics optional; ignore errors
      }

      const svg = generateSvg(stores, width, height, lang);
      await setCacheAsync(key, svg);
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.send(svg);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("heatmap static error", err);
      res.status(500).json({ error: "failed to render heatmap" });
    }
  },
);

/**
 * @openapi
 * /api/v1/nimbus/heatmap/static:
 *   post:
 *     tags: [Heatmap]
 *     summary: Generate a static SVG heatmap for given store coordinates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     storeSlug: { type: string }
 *                     longitude: { type: number }
 *                     latitude: { type: number }
 *                     engagement: { type: number }
 *               width: { type: number }
 *               height: { type: number }
 *     responses:
 *       200:
 *         description: SVG image
 *         content:
 *           image/svg+xml: {}
 *       400:
 *         description: validation error
 */

export default router;

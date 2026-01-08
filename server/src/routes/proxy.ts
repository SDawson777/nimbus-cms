import express from "express";

const router = express.Router();

/**
 * @openapi
 * /api/v1/nimbus/proxy/weather:
 *   get:
 *     tags: [Proxy]
 *     summary: Get weather for a city or coordinates (server-proxied)
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: proxied weather response
 *       400:
 *         description: bad request
 *       500:
 *         description: server error
 */
// Simple weather proxy: forwards requests to configured weather API using server-side key
router.get("/weather", async (req, res) => {
  try {
    const { lat, lon, city, units } = req.query as Record<string, string>;
    const apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;
    const baseUrl = process.env.OPENWEATHER_API_URL || process.env.WEATHER_API_URL || "https://api.openweathermap.org/data/2.5/weather";

    if (!apiKey) {
      return res.status(500).json({ error: "OpenWeather API key not configured on server" });
    }

    const params = new URLSearchParams();
    if (lat && lon) {
      params.set("lat", lat);
      params.set("lon", lon);
    } else if (city) {
      params.set("q", city);
    } else {
      return res.status(400).json({ error: "Provide either lat&lon or city query parameters" });
    }
    params.set("appid", apiKey);
    
    // Forward units parameter (imperial, metric, or standard/kelvin)
    if (units) {
      params.set("units", units);
    }

    const url = `${baseUrl}?${params.toString()}`;
    const r = await fetch(url);
    const body = await r.text();
    try {
      const { proxyRequests, proxyWeatherRequests } = await import("../metrics");
      proxyRequests.inc();
      proxyWeatherRequests.inc();
    } catch (e) {
      // ignore metrics errors
    }
    res.status(r.status).set("content-type", r.headers.get("content-type") || "application/json").send(body);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("weather proxy error", err);
    res.status(500).json({ error: "weather proxy failed" });
  }
});

/**
 * @openapi
 * /api/v1/nimbus/proxy/mapbox:
 *   get:
 *     tags: [Proxy]
 *     summary: Proxy Mapbox API requests (server-side token required)
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: any other Mapbox query params
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: proxied Mapbox response
 *       400:
 *         description: bad request
 *       500:
 *         description: server error
 */
// Mapbox proxy: fetch a given Mapbox URL path (e.g., static tiles) and stream back
// Usage: /mapbox?path=styles/v1/....&query=<other params>
router.get("/mapbox", async (req, res) => {
  try {
    const mapboxToken = process.env.MAPBOX_TOKEN || process.env.MAPBOX_SECRET;
    if (!mapboxToken) {
      return res.status(500).json({ error: "Mapbox token not configured on server" });
    }

    const { path: mbPath } = req.query as Record<string, string>;
    if (!mbPath) {
      return res.status(400).json({ error: "Missing required 'path' query parameter" });
    }

    // Rebuild query parameters excluding 'path'
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (k === "path") continue;
      params.set(k, String(v));
    }
    params.set("access_token", mapboxToken);

    const url = `https://api.mapbox.com/${mbPath}?${params.toString()}`;
    const r = await fetch(url);
    try {
      const { proxyRequests, proxyMapboxRequests } = await import("../metrics");
      proxyRequests.inc();
      proxyMapboxRequests.inc();
    } catch (e) {
      // ignore metrics errors
    }
    // Stream response
    res.status(r.status);
    r.headers.forEach((value, name) => res.setHeader(name, value));
    const body = await r.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("mapbox proxy error", err);
    res.status(500).json({ error: "mapbox proxy failed" });
  }
});

// Helper to report whether Mapbox token is configured server-side
router.get("/mapbox/has_token", (_req, res) => {
  const has = Boolean(process.env.MAPBOX_TOKEN || process.env.MAPBOX_SECRET);
  res.json({ enabled: has });
});

/**
 * @openapi
 * /api/v1/nimbus/proxy/mapbox/has_token:
 *   get:
 *     tags: [Proxy]
 *     summary: Returns whether server-side Mapbox token is configured
 *     responses:
 *       200:
 *         description: token status
 */
// Helper to report whether Mapbox token is configured server-side
router.get("/mapbox/has_token", (_req, res) => {
  const has = Boolean(process.env.MAPBOX_TOKEN || process.env.MAPBOX_SECRET);
  res.json({ enabled: has });
});

export default router;

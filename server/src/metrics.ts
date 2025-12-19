import client from "prom-client";

// Default registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Application-specific metrics
export const heatmapRequests = new client.Counter({
  name: "nimbus_heatmap_requests_total",
  help: "Total heatmap generation requests",
  registers: [register],
});

export const heatmapCacheHits = new client.Counter({
  name: "nimbus_heatmap_cache_hits_total",
  help: "Total heatmap cache hits",
  registers: [register],
});

export const proxyRequests = new client.Counter({
  name: "nimbus_proxy_requests_total",
  help: "Total proxy requests",
  registers: [register],
});

export const proxyMapboxRequests = new client.Counter({
  name: "nimbus_proxy_mapbox_requests_total",
  help: "Total proxy requests forwarded to Mapbox",
  registers: [register],
});

export const proxyWeatherRequests = new client.Counter({
  name: "nimbus_proxy_weather_requests_total",
  help: "Total proxy requests forwarded to weather API",
  registers: [register],
});

export function metricsHandler() {
  return async (_req, res) => {
    try {
      res.setHeader("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end();
    }
  };
}

export default register;

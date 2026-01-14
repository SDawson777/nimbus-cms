import client from "prom-client";
import type { Request, Response, NextFunction } from "express";

// Default registry with default Node.js metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE: Comprehensive Prometheus Metrics for Production Observability
// ═══════════════════════════════════════════════════════════════════════════

// HTTP Request Duration Histogram (RED metrics: Rate, Errors, Duration)
export const httpRequestDuration = new client.Histogram({
  name: "nimbus_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// HTTP Requests Total Counter
export const httpRequestsTotal = new client.Counter({
  name: "nimbus_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Active HTTP Connections Gauge
export const httpActiveConnections = new client.Gauge({
  name: "nimbus_http_active_connections",
  help: "Number of active HTTP connections",
  registers: [register],
});

// Authentication Metrics
export const authAttempts = new client.Counter({
  name: "nimbus_auth_attempts_total",
  help: "Total authentication attempts",
  labelNames: ["result", "method"], // result: success|failure|expired, method: password|token
  registers: [register],
});

export const activeSessions = new client.Gauge({
  name: "nimbus_active_sessions",
  help: "Number of active admin sessions",
  registers: [register],
});

// Database Query Metrics
export const dbQueryDuration = new client.Histogram({
  name: "nimbus_db_query_duration_seconds",
  help: "Database query duration in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

export const dbConnectionPool = new client.Gauge({
  name: "nimbus_db_connection_pool_size",
  help: "Current database connection pool size",
  labelNames: ["state"], // state: active|idle|waiting
  registers: [register],
});

// Business Metrics
export const ordersProcessed = new client.Counter({
  name: "nimbus_orders_processed_total",
  help: "Total orders processed",
  labelNames: ["store", "status"],
  registers: [register],
});

export const contentOperations = new client.Counter({
  name: "nimbus_content_operations_total",
  help: "Total content CMS operations",
  labelNames: ["operation", "content_type"], // operation: create|update|delete|publish
  registers: [register],
});

// Error Rate Metrics
export const errorRate = new client.Counter({
  name: "nimbus_errors_total",
  help: "Total error count by type",
  labelNames: ["type", "code"], // type: validation|auth|server|external
  registers: [register],
});

// Rate Limiting Metrics
export const rateLimitHits = new client.Counter({
  name: "nimbus_rate_limit_hits_total",
  help: "Number of requests that hit rate limits",
  labelNames: ["endpoint"],
  registers: [register],
});

// External Service Metrics (Sanity, Mapbox, etc.)
export const externalServiceDuration = new client.Histogram({
  name: "nimbus_external_service_duration_seconds",
  help: "External service call duration",
  labelNames: ["service", "operation"],
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const externalServiceErrors = new client.Counter({
  name: "nimbus_external_service_errors_total",
  help: "External service error count",
  labelNames: ["service", "error_type"],
  registers: [register],
});

// Existing application-specific metrics
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

// ═══════════════════════════════════════════════════════════════════════════
// Middleware for automatic HTTP metrics collection
// ═══════════════════════════════════════════════════════════════════════════
export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    httpActiveConnections.inc();

    res.on("finish", () => {
      httpActiveConnections.dec();
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      
      // Normalize route to avoid high cardinality
      const route = normalizeRoute(req.route?.path || req.path);
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
      };

      httpRequestDuration.observe(labels, duration);
      httpRequestsTotal.inc(labels);

      // Track errors
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? "server" : 
                          res.statusCode === 401 || res.statusCode === 403 ? "auth" :
                          res.statusCode === 400 ? "validation" : "client";
        errorRate.inc({ type: errorType, code: String(res.statusCode) });
      }
    });

    next();
  };
}

// Normalize routes to prevent metric cardinality explosion
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid")
    .replace(/\/\d+/g, "/:id")
    .replace(/\/[a-z0-9]{24,}/gi, "/:objectId");
}

export function metricsHandler() {
  return async (_req: Request, res: Response) => {
    try {
      res.setHeader("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end();
    }
  };
}

export default register;

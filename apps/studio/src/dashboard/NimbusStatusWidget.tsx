import React, { useEffect, useState } from "react";
import { Card, Stack, Text, Heading, Inline, Badge } from "@sanity/ui";

type StatusPayload = {
  apiHealthy: boolean;
  cmsHealthy: boolean;
  lastDeploymentAt: string | null;
  activeTenants: number;
};

const apiBase =
  process.env.SANITY_STUDIO_NIMBUS_API_URL ||
  process.env.SANITY_NIMBUS_API_URL ||
  "https://nimbus-api-prod.up.railway.app";

export function NimbusStatusWidget() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/status`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setStatus({
            apiHealthy: !!json.apiHealthy,
            cmsHealthy: !!json.cmsHealthy,
            lastDeploymentAt: json.lastDeploymentAt || null,
            activeTenants: json.activeTenants ?? 1,
          });
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Card padding={4} radius={3} shadow={1} tone="transparent">
      <Stack space={3}>
        <Heading size={2}>Nimbus Suite Health</Heading>
        {loading && <Text size={1}>Loading cluster status…</Text>}
        {error && (
          <Text size={1} tone="critical">
            {error}
          </Text>
        )}
        {status && (
          <Stack space={3}>
            <Inline space={3}>
              <Badge
                tone={status.apiHealthy ? "positive" : "critical"}
                padding={2}
                radius={999}
              >
                API {status.apiHealthy ? "Healthy" : "Degraded"}
              </Badge>
              <Badge
                tone={status.cmsHealthy ? "positive" : "critical"}
                padding={2}
                radius={999}
              >
                CMS {status.cmsHealthy ? "Healthy" : "Degraded"}
              </Badge>
            </Inline>
            <Text size={1} muted>
              Active tenants: {status.activeTenants}
            </Text>
            <Text size={1} muted>
              Last deployment:{" "}
              {status.lastDeploymentAt
                ? new Date(status.lastDeploymentAt).toLocaleString()
                : "Unknown"}
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

import React from "react";
import { Card, Flex, Stack, Text, Badge } from "@sanity/ui";
import { useClient } from "sanity";

const NimbusStatus: React.FC = () => {
  const client = useClient({ apiVersion: "2024-08-01" });
  const projectId = client.config().projectId;
  const dataset = client.config().dataset;

  const env =
    (process.env.SANITY_STUDIO_APP_ENV as string) ??
    (typeof window !== "undefined" &&
    window.location.hostname.includes("localhost")
      ? "development"
      : "production");

  return (
    <Card padding={4} tone="primary" radius={3}>
      <Stack space={3}>
        <Text size={2} weight="semibold">
          Nimbus CMS — Environment Status
        </Text>
        <Flex justify="space-between">
          <Stack space={1}>
            <Text size={1} muted>
              Project
            </Text>
            <Text size={2}>{projectId}</Text>
          </Stack>
          <Stack space={1}>
            <Text size={1} muted>
              Dataset
            </Text>
            <Badge mode="outline">{dataset}</Badge>
          </Stack>
          <Stack space={1}>
            <Text size={1} muted>
              Environment
            </Text>
            <Badge tone={env === "production" ? "positive" : "caution"}>
              {env}
            </Badge>
          </Stack>
        </Flex>
        <Text size={1} muted>
          This panel gives buyers confidence that Nimbus is multi-tenant,
          environment-aware, and production-ready.
        </Text>
      </Stack>
    </Card>
  );
};

export default NimbusStatus;

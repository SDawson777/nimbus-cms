import React from "react";
import { Card, Stack, Text, Label } from "@sanity/ui";

const EditorialAI: React.FC = () => {
  // For now, static demo topics. Later you can call your AI concierge endpoint.
  const suggestions = [
    "5 ways to dose Midnight Mints for better sleep",
    "Detroit — 8 Mile: top-selling hybrids this week",
    "How CBD tinctures fit into daytime routines",
  ];

  return (
    <Card padding={4} tone="caution" radius={3}>
      <Stack space={3}>
        <Text size={2} weight="semibold">
          Editorial assistant (demo)
        </Text>
        <Text size={1} muted>
          Suggested topics based on demo demand and journal patterns. Buyers see
          how Nimbus can steer editorial toward high-intent content.
        </Text>
        {suggestions.map((s) => (
          <Stack space={1} key={s}>
            <Label size={1}>Suggested article</Label>
            <Text size={2}>{s}</Text>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
};

export default EditorialAI;

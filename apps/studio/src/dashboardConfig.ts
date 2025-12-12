import type { DashboardConfig } from "@sanity/dashboard";
import { NimbusStatusWidget } from "./dashboard/NimbusStatusWidget";
import { EditorialAIWidget } from "./dashboard/EditorialAIWidget";
import { QuickActionsWidget } from "./dashboard/QuickActionsWidget";
import { EngagementMetricsWidget } from "./dashboard/EngagementMetricsWidget";

export const dashboardConfig: DashboardConfig = {
  widgets: [
    {
      name: "nimbus-status",
      title: "Nimbus Status",
      layout: { width: "full" },
      component: NimbusStatusWidget,
    },
    {
      name: "editorial-ai",
      title: "Editorial Intelligence",
      layout: { width: "medium" },
      component: EditorialAIWidget,
    },
    {
      name: "quick-actions",
      title: "Quick Actions",
      layout: { width: "small" },
      component: QuickActionsWidget,
    },
    {
      name: "engagement-metrics",
      title: "Engagement Snapshot",
      layout: { width: "full" },
      component: EngagementMetricsWidget,
    },
  ],
};

export default dashboardConfig;
